-- 0009_reviews_write.sql — real review submission (verified-stay gated),
-- review drafts, host replies, and an auto-maintained listing rating.
--
-- Today reviews.ts only reads; the write path lives in `review-drafts-store.ts`
-- (localStorage). This migration:
--   1. Hardens the reviews INSERT policy to require a *completed, non-cancelled
--      booking* by the same guest on the same listing (verified-stay gate).
--   2. Adds `reviews.status` so admin moderation can hide a review without losing
--      the row (the rating trigger ignores removed reviews).
--   3. Adds `review_drafts` (server-synced pre-submit state) and
--      `host_review_replies` (one host reply per review).
--   4. Keeps listings.rating_avg / rating_count correct via a trigger.

-- ---------------------------------------------------------------------------
-- 1 + 2. moderation status + verified-stay insert gate
-- ---------------------------------------------------------------------------
alter table public.reviews
  add column if not exists status text not null default 'visible'
  check (status in ('visible', 'removed'));

-- Replace the broad "for all" policy from 0001 with granular ones.
drop policy if exists "reviews guest write own" on public.reviews;

create policy "reviews verified-stay insert"
  on public.reviews for insert
  with check (
    auth.uid() = guest_id
    and exists (
      select 1 from public.bookings b
      where b.guest_id = auth.uid()
        and b.listing_id = reviews.listing_id
        and b.status <> 'cancelled'
        and b.end_date <= current_date
    )
  );

create policy "reviews guest update own"
  on public.reviews for update
  using (auth.uid() = guest_id)
  with check (auth.uid() = guest_id);

create policy "reviews guest delete own"
  on public.reviews for delete
  using (auth.uid() = guest_id);

-- ---------------------------------------------------------------------------
-- 3a. review_drafts — server-synced pre-submit state (keyed by booking)
-- ---------------------------------------------------------------------------
create table if not exists public.review_drafts (
  booking_id    uuid primary key references public.bookings(id) on delete cascade,
  guest_id      uuid not null references public.profiles(id) on delete cascade,
  listing_id    uuid not null references public.listings(id) on delete cascade,
  listing_title text not null default '',
  rating        integer not null check (rating between 1 and 5),
  body          text not null default '',
  updated_at    timestamptz not null default now()
);

create index if not exists review_drafts_guest_idx on public.review_drafts (guest_id, updated_at desc);

alter table public.review_drafts enable row level security;

create policy "review_drafts self all"
  on public.review_drafts for all
  using (auth.uid() = guest_id)
  with check (auth.uid() = guest_id);

-- ---------------------------------------------------------------------------
-- 3b. host_review_replies — one public reply per review, by the listing's host
-- ---------------------------------------------------------------------------
create table if not exists public.host_review_replies (
  review_id  uuid primary key references public.reviews(id) on delete cascade,
  host_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(body) > 0),
  created_at timestamptz not null default now()
);

alter table public.host_review_replies enable row level security;

create policy "host_review_replies public read"
  on public.host_review_replies for select
  using (true);

create policy "host_review_replies host write own"
  on public.host_review_replies for all
  using (
    auth.uid() = host_id
    and exists (
      select 1 from public.reviews r
      join public.listings l on l.id = r.listing_id
      where r.id = review_id and l.host_id = auth.uid()
    )
  )
  with check (
    auth.uid() = host_id
    and exists (
      select 1 from public.reviews r
      join public.listings l on l.id = r.listing_id
      where r.id = review_id and l.host_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. keep listings.rating_avg / rating_count in sync (visible reviews only)
-- ---------------------------------------------------------------------------
create or replace function public.recompute_listing_rating(p_listing_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.listings l
    set rating_avg = coalesce((
          select round(avg(r.rating)::numeric, 2)
          from public.reviews r
          where r.listing_id = p_listing_id and r.status = 'visible'
        ), 0),
        rating_count = (
          select count(*)
          from public.reviews r
          where r.listing_id = p_listing_id and r.status = 'visible'
        )
    where l.id = p_listing_id;
$$;

create or replace function public.on_review_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_listing_rating(old.listing_id);
    return old;
  else
    perform public.recompute_listing_rating(new.listing_id);
    return new;
  end if;
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();
