-- 0016_grants.sql — explicit table/sequence privileges for the API roles.
--
-- Supabase's cloud projects auto-grant anon/authenticated on public tables, but
-- that is a project-config default, not something the schema guarantees. This
-- migration makes the grants explicit so the app works identically on any
-- project (and on a restrictive local instance): every public table is reachable
-- by the API roles, while **RLS remains the real row-level gate** — a broad
-- table grant only says "this role may attempt access"; the policies decide which
-- rows. anon gets SELECT only (it can read public-read tables like listings; RLS
-- yields zero rows on user-scoped tables since anon has no auth.uid()).
--
-- Idempotent: re-granting is a no-op. Safe on cloud (matches the existing
-- implicit grants) and corrective on a locked-down local DB.

grant usage on schema public to anon, authenticated, service_role;

-- Read for both anon + authenticated (RLS filters rows); write for authenticated.
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

-- Sequences (identity columns etc.) the API roles may need when inserting.
grant usage, select on all sequences in schema public to anon, authenticated;

-- Make the same grants the default for tables/sequences created by future
-- migrations (run as the postgres role), so later schema work inherits them.
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
