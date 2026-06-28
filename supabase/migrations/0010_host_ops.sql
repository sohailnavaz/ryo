-- 0010_host_ops.sql — host operational backends: booking request decisions,
-- host-side cancellation metadata, payout methods, and KYC checks.
--
-- Replaces `host-actions-store.ts` (accept/decline/cancel) and
-- `host-verification-store.ts` (payout method + KYC) localStorage layers.

-- ---------------------------------------------------------------------------
-- 1. booking request lifecycle + cancellation metadata
-- ---------------------------------------------------------------------------
-- Widen the status enum to cover request-to-book (pending → accepted/declined)
-- alongside the existing confirmed/cancelled instant-book path.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending', 'accepted', 'confirmed', 'declined', 'cancelled'));

alter table public.bookings
  add column if not exists host_decision_note text,
  add column if not exists host_decision_at   timestamptz,
  add column if not exists cancel_reason_code  text,
  add column if not exists cancelled_by        text check (cancelled_by in ('guest', 'host', 'admin'));

-- A host may read+update bookings on their own listings (accept/decline/cancel).
-- 0001 already grants host SELECT; add the UPDATE path here.
create policy "bookings host update own listings"
  on public.bookings for update
  using (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. host_payout_methods — one payout destination per host
-- ---------------------------------------------------------------------------
create table if not exists public.host_payout_methods (
  host_id        uuid primary key references public.profiles(id) on delete cascade,
  kind           text not null check (kind in ('bank', 'upi')),
  account_name   text not null,
  account_number text,          -- store last digits only at the app layer
  routing_code   text,          -- IFSC / SWIFT
  upi_id         text,
  currency       text not null default 'INR',
  schedule       text not null default 'per_booking' check (schedule in ('per_booking', 'weekly', 'monthly')),
  saved_at       timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.host_payout_methods enable row level security;

create policy "host_payout_methods self all"
  on public.host_payout_methods for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- ---------------------------------------------------------------------------
-- 3. host_kyc_checks — the four verification checks per host
-- ---------------------------------------------------------------------------
create table if not exists public.host_kyc_checks (
  host_id    uuid not null references public.profiles(id) on delete cascade,
  check_type text not null check (check_type in ('id', 'selfie', 'address', 'property_right')),
  status     text not null default 'not_started' check (status in ('not_started', 'pending', 'verified', 'rejected')),
  reference  text,
  updated_at timestamptz not null default now(),
  primary key (host_id, check_type)
);

alter table public.host_kyc_checks enable row level security;

create policy "host_kyc_checks self read"
  on public.host_kyc_checks for select
  using (auth.uid() = host_id or public.is_staff());

-- Host submits a check (→ pending); staff move it to verified/rejected.
create policy "host_kyc_checks self write"
  on public.host_kyc_checks for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "host_kyc_checks staff update"
  on public.host_kyc_checks for update
  using (public.is_staff())
  with check (public.is_staff());
