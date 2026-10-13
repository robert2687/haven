-- Haven migration 0001: core identity + chat tables.
-- Incremental alternative to database/schema.sql — pick ONE path, not both.
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_email_key' and conrelid = 'public.users'::regclass
  ) then
    alter table public.users add constraint users_email_key unique (email);
  end if;
end $$;

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

-- Shared trigger fn (reused by 0004 documents). PL/pgSQL needs EXECUTE for DDL.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'conversations_touch_updated_at' and not tgisinternal
  ) then
    execute 'create trigger conversations_touch_updated_at
      before update on public.conversations
      for each row execute function public.touch_updated_at()';
  end if;
end $$;
