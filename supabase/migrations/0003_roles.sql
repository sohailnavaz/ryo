-- 0003_roles.sql — role-based access foundation (L1)
--
-- Adds a `role` to profiles and an `is_staff()` helper used by the admin route
-- guard and by privileged RLS policies (L4 graduates the admin console's
-- client-side override store to real tables gated on this). Additive only —
-- existing policies are untouched. Default role is 'guest'; a profile becomes
-- 'host' in app logic when they publish a listing; 'staff'/'admin' are granted
-- out-of-band (SQL/console) until a staff-admin UI exists.

-- 1. role column ------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'guest'
  check (role in ('guest', 'host', 'staff', 'admin'));

create index if not exists profiles_role_idx on public.profiles (role);

-- 2. staff predicate (SECURITY DEFINER so RLS policies can call it without
--    recursing through the profiles RLS) ----------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

-- 3. let the new-user trigger keep the default role (column default handles
--    it); re-declare for clarity + to set role explicitly on insert -------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'guest'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
