-- 0007_grants.sql — make table privileges EXPLICIT.
--
-- Found while driving the admin console against a local Supabase: every PostgREST
-- read returned 403 `permission denied for table listings` — not an RLS denial, a
-- missing GRANT. `anon` and `authenticated` held only TRUNCATE/REFERENCES/TRIGGER
-- on every table in the schema, including the ones that have shipped since M1.
--
-- Why: there are two default-ACL rules on schema `public`.
--
--   owner = supabase_admin  ->  anon/authenticated get arwdDxt  (includes SELECT)
--   owner = postgres        ->  anon/authenticated get Dxt      (NO SELECT, NO INSERT)
--
-- Migrations run as `postgres`, so every table our migrations create lands under the
-- second rule and is unreachable by the API roles. The hosted project papers over
-- this (it grants after migrating), which is why the app works in production and not
-- locally — a schema that behaves differently per environment is a bug waiting for a
-- deploy day, so we stop inheriting privileges and state them.
--
-- RLS is unchanged and still does the real work: a GRANT says "this role may touch
-- this table at all"; the POLICY says "and only these rows". Both are required.
-- Least privilege applies — nobody gets a verb they have no policy for.

-- ---------------------------------------------------------------------------
-- Guest-facing tables. RLS (0001) already restricts rows; these are the verbs.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

-- Public read surfaces (RLS: "listings are public read")
grant select                         on public.listings       to anon, authenticated;
grant select                         on public.listing_photos to anon, authenticated;
grant select                         on public.reviews        to anon, authenticated;
grant select                         on public.profiles       to anon, authenticated;

-- Owner-scoped writes (RLS pins each to auth.uid())
grant insert, update, delete         on public.listings       to authenticated;
grant insert, update, delete         on public.listing_photos to authenticated;
grant insert, update, delete         on public.reviews        to authenticated;
grant insert, update                 on public.profiles       to authenticated;
grant select, insert, update         on public.bookings       to authenticated;
grant select, insert, delete         on public.favorites      to authenticated;

-- ---------------------------------------------------------------------------
-- Console tables (0005/0006). Read-only to the API role — every privileged WRITE
-- goes through admin_action(), which is SECURITY DEFINER and runs as the owner.
-- Granting INSERT/UPDATE here would open a second door into the audit log, and the
-- whole point of the spine is that there is exactly one.
-- ---------------------------------------------------------------------------

grant select on public.reason_codes           to authenticated;
grant select on public.admin_actions_registry to authenticated;
grant select on public.approvals              to authenticated;
grant select on public.audit_log              to authenticated;   -- RLS: staff only
grant select on public.events                 to authenticated;   -- RLS: staff only

-- Saved views are the one console table an operator writes to directly (they are
-- their own segments), and RLS confines them to `owner_id = auth.uid()`.
grant select, insert, delete on public.admin_views to authenticated;

-- The API roles must never reach the governance tables anonymously.
revoke all on public.audit_log              from anon;
revoke all on public.events                 from anon;
revoke all on public.approvals              from anon;
revoke all on public.admin_views            from anon;
revoke all on public.admin_actions_registry from anon;
revoke all on public.reason_codes           from anon;

-- Nothing may write the audit log or the event stream through the API, ever — not
-- even a staff member. Both are append-only via SECURITY DEFINER functions.
revoke insert, update, delete on public.audit_log from authenticated;
revoke insert, update, delete on public.events    from authenticated;

-- And stop the next migration from re-introducing the problem: future tables created
-- by `postgres` in `public` get sane defaults instead of the SELECT-less ones.
alter default privileges for role postgres in schema public
  grant select on tables to anon, authenticated;
