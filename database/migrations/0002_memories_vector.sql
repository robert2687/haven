-- Haven migration 0002: long-term memories + pgvector search.
-- Backward compatible with legacy rows (content/metadata kept).

create extension if not exists "vector";

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

-- For DBs created before memory/importance existed.
alter table public.memories add column if not exists memory text not null default '';
alter table public.memories add column if not exists importance float;
alter table public.memories add column if not exists content text not null default '';
alter table public.memories add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists memories_user_id_idx on public.memories (user_id);
create index if not exists memories_embedding_idx
  on public.memories using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Cosine search used by POST /api/memory/search.
create or replace function public.match_memories(
  query_embedding vector(768),
  match_count int default 5,
  match_threshold float default 0.0,
  filter_user_id text default null
)
returns table (
  id uuid,
  user_id text,
  content text,
  metadata jsonb,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    m.id,
    m.user_id,
    m.content,
    m.metadata,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.memories m
  where m.embedding is not null
    and (filter_user_id is null or m.user_id = filter_user_id)
    and (1 - (m.embedding <=> query_embedding)) >= match_threshold
  order by m.embedding <=> query_embedding
  limit match_count;
$$;
