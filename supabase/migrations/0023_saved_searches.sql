-- 0023_saved_searches.sql — save a search, get notified when a new place matches.
--
-- A guest saves the current explore filters; when a host publishes a listing that
-- matches (destination + price range + capacity + type), the saved-search owner
-- gets a notification (reusing notify() from 0022). Prices are stored in cents to
-- match `listings.price_cents`.

create table if not exists public.saved_searches (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  label           text not null default '',
  destination     text,
  guests          integer,
  min_price_cents integer,
  max_price_cents integer,
  property_types  text[],
  notify          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists saved_searches_profile_idx
  on public.saved_searches (profile_id, created_at desc);
-- Partial index for the match trigger's lookup of alerting rows.
create index if not exists saved_searches_notify_idx
  on public.saved_searches (notify) where notify = true;

alter table public.saved_searches enable row level security;

create policy "saved_searches self all"
  on public.saved_searches for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- New listing → notify owners of matching saved searches (that opted in).
-- Each null filter is treated as "no constraint". A host is never alerted about
-- their own new listing.
-- ---------------------------------------------------------------------------
create or replace function public.tg_listing_match_notify() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select s.profile_id
    from public.saved_searches s
    where s.notify
      and s.profile_id <> new.host_id
      and (s.destination is null or s.destination = ''
           or new.city    ilike '%' || s.destination || '%'
           or new.country ilike '%' || s.destination || '%')
      and (s.guests is null          or new.max_guests >= s.guests)
      and (s.min_price_cents is null or new.price_cents >= s.min_price_cents)
      and (s.max_price_cents is null or new.price_cents <= s.max_price_cents)
      and (s.property_types is null  or array_length(s.property_types, 1) is null
           or new.property_type = any(s.property_types))
  loop
    perform public.notify(
      r.profile_id,
      'system',
      'New place matches your search',
      new.title || ' · ' || new.city || ', ' || new.country
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists listing_match_notify on public.listings;
create trigger listing_match_notify
  after insert on public.listings
  for each row execute function public.tg_listing_match_notify();
