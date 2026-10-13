-- Haven RLS policies (Supabase). Run AFTER database/schema.sql.
-- Backend uses the service-role SUPABASE_KEY server-side (bypasses RLS);
-- these policies govern direct browser access via the anon key.
-- Users row id is app-generated; link it to auth.users.id on sign-up
-- (insert into public.users with id = auth.uid()) for owner policies to hold.

alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.voices enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

-- users: owners read/update own row; inserts allowed for self-registration.
create policy "users self read"
  on public.users for select to authenticated
  using (auth.uid() = id);
create policy "users self insert"
  on public.users for insert to authenticated
  with check (auth.uid() = id);
create policy "users self update"
  on public.users for update to authenticated
  using (auth.uid() = id);

-- conversations / voices / documents: owner-only (user_id = auth.uid()).
create policy "conversations owner all"
  on public.conversations for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "voices owner all"
  on public.voices for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents owner all"
  on public.documents for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- messages: via parent conversation ownership.
create policy "messages owner read"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and c.user_id = auth.uid()
  ));
create policy "messages owner write"
  on public.messages for insert to authenticated
  with check (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and c.user_id = auth.uid()
  ));

-- document_chunks: via parent document ownership.
create policy "chunks owner read"
  on public.document_chunks for select to authenticated
  using (exists (
    select 1 from public.documents d
    where d.id = document_chunks.document_id and d.user_id = auth.uid()
  ));
create policy "chunks owner write"
  on public.document_chunks for insert to authenticated
  with check (exists (
    select 1 from public.documents d
    where d.id = document_chunks.document_id and d.user_id = auth.uid()
  ));

-- memories.user_id is free-form text (legacy contract): authenticated-only,
-- no owner check possible. Tighten once callers store auth.uid()::text.
create policy "memories authenticated read"
  on public.memories for select to authenticated using (true);
create policy "memories authenticated write"
  on public.memories for insert to authenticated with check (true);
