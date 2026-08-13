-- 0020_incidents_guest_update.sql — a guest must not be able to mutate their incident.
--
-- SECURITY / TRUST-&-SAFETY FIX. main's incidents table had a guest UPDATE policy
--   using (auth.uid() = guest_id)
-- with no column restriction, so a guest could change ANY field of their own incident
-- — including `status`, `tier`, and `assigned_to`. In practice: a guest could mark
-- their own safety incident "resolved" and make it vanish from the ops queue, bump its
-- tier, or reassign it. Incidents are a T&S surface; only staff resolve/assign them.
--
-- The app only ever updates incident status/assignment from the admin console, which
-- runs under the `is_staff()` UPDATE policy — so guests never needed row UPDATE at all.
-- Guests still CREATE incidents (insert policy) and add information through
-- incident_events. Dropping the guest UPDATE policy closes the hole with no feature loss.

drop policy if exists "incidents update own" on public.incidents;

-- Some earlier drafts named it differently; drop any guest-scoped UPDATE policy that
-- isn't the staff one, so this is robust to the exact name.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
     where schemaname='public' and tablename='incidents' and cmd='UPDATE'
       and coalesce(qual,'') like '%guest_id%'
  loop
    execute format('drop policy if exists %I on public.incidents', p.policyname);
  end loop;
end $$;

-- The staff UPDATE policy (is_staff()) remains — resolving/assigning is staff-only.
