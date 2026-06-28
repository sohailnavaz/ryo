-- 0013_storage.sql — Storage buckets for user/host uploads.
--
-- Two public-read buckets (so <img src> works without signed URLs):
--   * avatars        — profile photos, written under `<auth.uid()>/...`
--   * listing_photos — listing imagery, written under `<auth.uid()>/...`
-- Write access is gated to the owner via the first path segment matching the
-- caller's uid. Replaces the URL-paste-only avatar/photo flow.

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('listing_photos', 'listing_photos', true)
on conflict (id) do nothing;

-- Public read on both buckets.
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "listing_photos public read"
  on storage.objects for select
  using (bucket_id = 'listing_photos');

-- Owner write: object path must start with the caller's uid (e.g. `<uid>/file.jpg`).
create policy "avatars owner write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "listing_photos owner write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'listing_photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'listing_photos' and (storage.foldername(name))[1] = auth.uid()::text);
