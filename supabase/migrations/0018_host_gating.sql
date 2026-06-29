-- 0018_host_gating.sql — close the host-approval gate at the DB layer.
--
-- A code review of the host-application flow (0017) found the gate was
-- CLIENT-ONLY: with the browser anon key, any signed-in guest could
--   (a) self-promote `profiles.role` to 'host',
--   (b) self-approve their own host_application (status = 'approved'), and/or
--   (c) insert a live listing directly via PostgREST,
-- because `listings host write own` checked only `auth.uid() = host_id` and the
-- applicant RLS policies never pinned `status`. This migration moves the gate
-- into the database so the client checks (useCanPublishListings) are UX, not the
-- security boundary.

-- 1) can_publish(uid): the single source of truth for publish eligibility —
--    an approved host (role) or an approved application. Mirrored by the client
--    hook for UX; enforced here for real.
create or replace function public.can_publish(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('host', 'staff', 'admin')
  ) or exists (
    select 1 from public.host_applications a
    where a.user_id = uid and a.status = 'approved'
  );
$$;
grant execute on function public.can_publish(uuid) to anon, authenticated;

-- 2) Gate listings INSERT on approval. The old `listings host write own` was
--    `for all` (insert+update+delete) using only ownership. Split it so an
--    owner can still update/delete their rows, but INSERT additionally requires
--    can_publish().
drop policy if exists "listings host write own" on public.listings;

create policy "listings owner update"
  on public.listings for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "listings owner delete"
  on public.listings for delete
  using (auth.uid() = host_id);

create policy "listings approved-host insert"
  on public.listings for insert
  with check (auth.uid() = host_id and public.can_publish(auth.uid()));

-- 3) Block role self-elevation. A user may edit their own profile, but only
--    staff may change the privileged `role` column. (The `profiles staff update`
--    policy from 0012 + this trigger together mean role moves are staff-only.)
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_staff() then
    raise exception 'role changes are staff-only';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();

-- 4) Pin host_applications status for applicant-driven writes so an applicant
--    can never set their OWN row to 'approved'/'rejected' (those are staff-only,
--    via the existing "host_applications staff update" policy).
drop policy if exists "host_applications self insert" on public.host_applications;
create policy "host_applications self insert"
  on public.host_applications for insert
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "host_applications self update" on public.host_applications;
create policy "host_applications self update"
  on public.host_applications for update
  using (auth.uid() = user_id and status in ('pending', 'changes_requested'))
  with check (auth.uid() = user_id and status in ('pending', 'changes_requested'));

-- 5) Atomic approval — flip the application + elevate role + stamp the reviewer
--    in ONE transaction (was two separate client writes that could half-fail).
--    Clients should call this RPC instead of the two-write path.
create or replace function public.approve_host_application(app_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app_user uuid;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  update public.host_applications
    set status = 'approved',
        reviewer_id = auth.uid(),
        review_note = note,
        reviewed_at = now(),
        updated_at = now()
    where id = app_id and status in ('pending', 'changes_requested')
    returning user_id into app_user;
  if app_user is null then
    raise exception 'application not found or already decided';
  end if;
  update public.profiles set role = 'host' where id = app_user and role = 'guest';
end;
$$;
grant execute on function public.approve_host_application(uuid, text) to authenticated;
