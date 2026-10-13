-- Haven migration 0004: documents + chunk embeddings (RAG) + vector search.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_user_id_idx on public.documents (user_id);

-- touch_updated_at() is created in 0001; guard in case it is missing.
do $$ begin
  if not exists (select 1 from pg_proc where proname = 'touch_updated_at') then
    create or replace function public.touch_updated_at()
    returns trigger language plpgsql as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'documents_touch_updated_at' and not tgisinternal
  ) then
    execute 'create trigger documents_touch_updated_at
      before update on public.documents
      for each row execute function public.touch_updated_at()';
  end if;
end $$;

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

-- Cosine search used by backend/app/services/search_service.py.
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
