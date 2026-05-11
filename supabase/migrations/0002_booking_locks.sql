-- Booking lock: prevent two concurrent bookings of the same listing on overlapping dates.
--
-- 0001_init.sql defined `bookings` with (listing_id, start_date, end_date) and only a
-- CHECK that end > start. That leaves a race window: two parallel inserts can both
-- pass any application-side availability check, then both write `confirmed` rows for
-- the same dates. The result is a stay collision the guest only discovers at arrival.
--
-- Fix: add a Postgres exclusion constraint using `daterange` + the GIST index from the
-- `btree_gist` extension. Postgres serialises overlap checks at insert time, so the
-- second row gets rejected with SQLSTATE 23P01 (exclusion_violation) and the
-- application can surface that to the guest.
--
-- The constraint only applies to non-cancelled bookings, so a cancellation does free
-- the dates for someone else to book.

create extension if not exists btree_gist;

-- Generated column: half-open daterange [start, end). Half-open is correct because
-- check-out date is when the guest leaves; that day is available for the next guest.
alter table public.bookings
  add column if not exists stay_range daterange
  generated always as (daterange(start_date, end_date, '[)')) stored;

-- The exclusion: same listing_id (=) + overlapping daterange (&&) is forbidden,
-- unless one of the rows is cancelled.
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    listing_id with =,
    stay_range with &&
  )
  where (status <> 'cancelled');

-- Helpful index for the host-facing "what bookings overlap this window?" query.
create index if not exists bookings_listing_range_idx
  on public.bookings using gist (listing_id, stay_range)
  where status <> 'cancelled';
