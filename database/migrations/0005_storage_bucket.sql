-- Haven migration 0005: storage bucket for app assets.
-- Bucket name must match STORAGE_BUCKET (default: haven-assets).

insert into storage.buckets (id, name, public)
values ('haven-assets', 'haven-assets', true)
on conflict (id) do nothing;

drop policy if exists "haven-assets public read" on storage.objects;
create policy "haven-assets public read"
  on storage.objects for select
  using (bucket_id = 'haven-assets');

drop policy if exists "haven-assets authenticated write" on storage.objects;
create policy "haven-assets authenticated write"
  on storage.objects for insert
  with check (bucket_id = 'haven-assets' and auth.role() = 'authenticated');
