-- 0011_harden_auth.sql — close the demo-role bypass and stop leaking staff identities.
--
-- Two problems, found by attacking the running app rather than reading the code.
--
-- 1. THE DEMO BYPASS. `DEMO_ADMIN` carried `role: 'admin'` in client-side metadata,
--    `useRole()` trusted it without any server lookup, and `StaffGate` let it walk
--    straight into /admin — on the live site.
--
--    The good news, and the reason this is a defense-in-depth failure rather than a
--    breach: the database refuses everything. Every console RPC is SECURITY DEFINER
--    and re-checks `auth.uid()` against a real JWT, so a demo "admin" (who holds no
--    JWT at all) gets `permission denied` on admin_action, admin_list_users,
--    finance_pl, and audit_log — verified with curl. It grants admin CHROME over an
--    empty console.
--
--    That is still unacceptable: it trains the operator to think the guard works, and
--    the day someone adds a read hook that forgets to check the role, it becomes a
--    real breach. The role now comes from the SERVER (`my_role()`), never from
--    client-held metadata. The TS side additionally refuses to mint a demo admin.
--
-- 2. PROFILES LEAKED EVERY USER'S ROLE. `profiles` is public-read (0001) so listing
--    pages can show a host's name — but that policy exposed EVERY column, including
--    `role` and `status`. An anonymous `GET /rest/v1/profiles?select=id,full_name,role`
--    returned the full staff roster. Handy for anyone deciding whom to phish.
--
--    Row-level security cannot fix this: the rows genuinely are public. The right tool
--    is COLUMN-level privilege — public reads see only the columns a listing page
--    actually needs.

-- ---------------------------------------------------------------------------
-- 1. Only the public columns of a profile are publicly readable.
-- ---------------------------------------------------------------------------

revoke select on public.profiles from anon, authenticated;

-- What a listing page legitimately needs to render "Hosted by Mira".
grant select (id, full_name, avatar_url, created_at) on public.profiles to anon, authenticated;

-- `role`, `status`, `suspended_at` and `suspended_reason` are now invisible to the
-- API roles entirely. Staff surfaces read them through SECURITY DEFINER functions,
-- which run as the owner and are gated on is_staff().

-- ---------------------------------------------------------------------------
-- 2. Your own role comes from the server, or not at all.
-- ---------------------------------------------------------------------------

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'guest'          -- signed out, or no profile row yet
  );
$$;

revoke all on function public.my_role() from public;
grant execute on function public.my_role() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. A suspended account must not be able to act.
--
-- Suspension previously set a flag that only the console read — the user could still
-- book. A suspension that doesn't suspend anything is theatre, and we have removed
-- enough of that already.
-- ---------------------------------------------------------------------------

create or replace function public.is_suspended()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and status = 'suspended'
  );
$$;

grant execute on function public.is_suspended() to authenticated;

drop policy if exists "bookings guest insert own" on public.bookings;
create policy "bookings guest insert own"
  on public.bookings for insert
  with check (auth.uid() = guest_id and not public.is_suspended());

drop policy if exists "listings host insert own" on public.listings;
create policy "listings host insert own"
  on public.listings for insert
  with check (auth.uid() = host_id and not public.is_suspended());
