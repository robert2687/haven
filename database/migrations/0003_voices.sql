-- Haven migration 0003: per-user voice preferences.

create table if not exists public.voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  voice_name text not null default '',
  language text not null default 'en-US',
  provider text not null default 'edge-tts'
);
create index if not exists voices_user_id_idx on public.voices (user_id);
