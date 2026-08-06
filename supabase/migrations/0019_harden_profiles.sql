-- 0019_harden_profiles.sql — close the profiles role/status leak.
--
-- SECURITY FIX. `profiles` is public-read (a listing page shows "Hosted by Mira"), but
-- the policy exposed EVERY column — so an anonymous
--   GET /rest/v1/profiles?select=id,full_name,role
-- returned every user's role, i.e. the full staff/admin roster. Handy for anyone
-- deciding whom to phish, and a privacy problem for `status` (who's suspended).
--
-- RLS can't fix this — the rows genuinely are public. The right tool is COLUMN-level
-- privilege: the API roles may read only the columns a listing page needs. `role` and
-- `status` become invisible over the API and are read server-side via SECURITY DEFINER
-- helpers (`my_role()` for your own role; `is_staff()` already exists).

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'guest'                                  -- signed out / no row yet
  );
$$;

revoke all on function public.my_role() from public;
grant execute on function public.my_role() to anon, authenticated;

-- The leak: revoke the whole-row read, re-grant only the public columns.
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, avatar_url, created_at) on public.profiles to anon, authenticated;

-- Staff still update status/role through the existing privileged paths (RLS/policies
-- unchanged); this only removes the ability to READ role/status over the public API.
