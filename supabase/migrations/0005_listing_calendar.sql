-- 0005_listing_calendar.sql — per-day host calendar overrides + privacy-safe
-- booked-range RPC.
--
-- Replaces the client-side `host-calendar-store.ts` localStorage layer: a host
-- can block/re-open a day or set a per-day nightly price override, persisted per
-- (listing, date). Public read so the guest availability calendar can grey-out
-- blocked days. `listing_booked_ranges()` is the RPC `bookings.ts` already calls
-- (it currently fails soft to synthetic) — returns only date ranges, never guest
-- identity, so it is safe to expose to anon.

-- ---------------------------------------------------------------------------
-- listing_calendar — one row per (listing, date) that has an override
-- ---------------------------------------------------------------------------
create table if not exists public.listing_calendar (
  listing_id  uuid not null references public.listings(id) on delete cascade,
  date        date not null,
  blocked     boolean,
  price_cents integer check (price_cents is null or price_cents >= 0),
  updated_at  timestamptz not null default now(),
  primary key (listing_id, date)
);

create index if not exists listing_calendar_listing_idx
  on public.listing_calendar (listing_id, date);

alter table public.listing_calendar enable row level security;

-- Public read: the availability calendar greys-out blocked days for everyone.
create policy "listing_calendar public read"
  on public.listing_calendar for select
  using (true);

-- Only the listing's host can write its calendar.
create policy "listing_calendar host write own"
  on public.listing_calendar for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- listing_booked_ranges(p_listing_id) — privacy-safe availability source
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so it can read across bookings RLS, but it only ever returns
-- (start_date, end_date) for non-cancelled bookings — no guest identity leaks.
create or replace function public.listing_booked_ranges(p_listing_id uuid)
returns table (start_date date, end_date date)
language sql
stable
security definer
set search_path = public
as $$
  select b.start_date, b.end_date
  from public.bookings b
  where b.listing_id = p_listing_id
    and b.status <> 'cancelled'
  order by b.start_date;
$$;

grant execute on function public.listing_booked_ranges(uuid) to anon, authenticated;
