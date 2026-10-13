-- Haven memories + pgvector search. Run once in the Supabase SQL editor.

create extension if not exists vector;
create extension if not exists "pgcrypto";

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  content text not null,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists memories_user_id_idx
  on public.memories (user_id);

create index if not exists memories_embedding_idx
  on public.memories using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Cosine-similarity search used by POST /api/memory/search.
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

-- Storage bucket for app assets (name must match STORAGE_BUCKET).
insert into storage.buckets (id, name, public)
values ('haven-assets', 'haven-assets', true)
on conflict (id) do nothing;

-- Public read; authenticated write. Adjust to your RLS needs.
create policy "haven-assets public read"
  on storage.objects for select
  using (bucket_id = 'haven-assets');

create policy "haven-assets authenticated write"
  on storage.objects for insert
  with check (bucket_id = 'haven-assets' and auth.role() = 'authenticated');
