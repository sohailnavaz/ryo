-- 0012_admin_moderation.sql — real moderation state + feature flags + audit log.
--
-- Graduates `admin-store.ts` (the localStorage override layer behind the admin
-- console's top-5 actions) to real tables, gated on is_staff() from 0003:
--   * profiles.status     — suspend / reinstate a user
--   * listings.moderation_status — approve / reject / request changes
--   * reviews.status      — keep / remove (column added in 0009)
--   * feature_flags       — toggle flags (public read; staff write)
--   * audit_log           — append-only record of every privileged action

-- ---------------------------------------------------------------------------
-- 1. moderation status columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended'));

alter table public.listings
  add column if not exists moderation_status text not null default 'approved'
  check (moderation_status in ('pending', 'approved', 'rejected', 'changes_requested'));

create index if not exists listings_moderation_idx on public.listings (moderation_status);

-- Staff can update any profile (e.g. set status) and any listing (moderation).
create policy "profiles staff update"
  on public.profiles for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "listings staff update"
  on public.listings for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "reviews staff update"
  on public.reviews for update
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- 2. feature_flags — public read so the app can gate features; staff write
-- ---------------------------------------------------------------------------
create table if not exists public.feature_flags (
  key        text primary key,
  enabled    boolean not null default false,
  note       text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;

create policy "feature_flags public read"
  on public.feature_flags for select
  using (true);

create policy "feature_flags staff write"
  on public.feature_flags for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- 3. audit_log — append-only record of privileged staff actions
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_label text not null default '',
  action      text not null,
  target      text not null,
  reason_code text not null default '',
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id, created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log staff read"
  on public.audit_log for select
  using (public.is_staff());

-- Staff append only; no update/delete policy ⇒ rows are immutable under RLS.
create policy "audit_log staff insert"
  on public.audit_log for insert
  with check (public.is_staff());
