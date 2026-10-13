-- Haven database schema: users + conversations + messages + memories + voices + documents.
-- Run once in Supabase SQL editor, or via migrations/ in order.
-- Additive: does not drop existing public.memories data.

create extension if not exists "pgcrypto";
create extension if not exists vector;

-- Users: id, email, name, avatar_url, created_at
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Conversations: id, user_id, title, created_at, updated_at
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_id_idx
  on public.conversations (user_id);
create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);

-- Keep updated_at fresh on write.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
  before update on public.conversations
  for each row execute function public.touch_updated_at();

-- Messages: id, conversation_id, role, content, model, created_at
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  model text,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id);
create index if not exists messages_created_at_idx
  on public.messages (created_at);

-- Memories: id, user_id, memory, embedding, importance, created_at.
-- Legacy columns content/metadata kept for the existing /api/memories router.
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  memory text not null default '',
  content text not null default '',
  embedding vector(768),
  importance float,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
-- Additive migration for DBs created before memory/importance existed.
alter table public.memories add column if not exists memory text not null default '';
alter table public.memories add column if not exists importance float;
alter table public.memories add column if not exists content text not null default '';
alter table public.memories add column if not exists metadata jsonb not null default '{}'::jsonb;
create index if not exists memories_user_id_idx on public.memories (user_id);
create index if not exists memories_embedding_idx
  on public.memories using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Voices: id, user_id, voice_name, language, provider
create table if not exists public.voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  voice_name text not null default '',
  language text not null default 'en-US',
  provider text not null default 'edge-tts'
);
create index if not exists voices_user_id_idx on public.voices (user_id);

-- Documents: parent record for uploaded/ingested content.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_user_id_idx on public.documents (user_id);
drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at
  before update on public.documents
  for each row execute function public.touch_updated_at();

-- Document chunks: chunked text + embeddings for vector search.
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  chunk_index int not null default 0,
  content text not null default '',
  embedding vector(768),
  created_at timestamptz not null default now()
);
create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);
create index if not exists document_chunks_embedding_idx
  on public.document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Cosine-similarity search over chunks (mirrors match_memories).
create or replace function public.match_document_chunks(
  query_embedding vector(768),
  match_count int default 5,
  match_threshold float default 0.0,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.chunk_index,
    c.content,
    c.created_at,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where c.embedding is not null
    and (filter_user_id is null or d.user_id = filter_user_id)
    and (1 - (c.embedding <=> query_embedding)) >= match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
