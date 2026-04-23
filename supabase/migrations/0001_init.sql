-- bnb schema — initial
-- Listings, photos, bookings, reviews, favorites, profiles
-- All tables enable RLS. Policies allow public read on listings; per-user writes elsewhere.

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- profiles (mirrors auth.users so we can expose non-sensitive fields publicly)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles select self or public name"
  on public.profiles for select
  using (true);

create policy "profiles update self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles insert self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  description    text not null default '',
  price_cents    integer not null check (price_cents >= 0),
  currency       text not null default 'USD',
  property_type  text not null,
  bedrooms       integer not null default 1,
  bathrooms      numeric(3,1) not null default 1,
  max_guests     integer not null default 2,
  address        text not null default '',
  city           text not null,
  country        text not null,
  lat            double precision not null,
  lng            double precision not null,
  amenities      jsonb not null default '[]'::jsonb,
  rating_avg     numeric(3,2) not null default 0,
  rating_count   integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists listings_city_idx  on public.listings (city);
create index if not exists listings_price_idx on public.listings (price_cents);
create index if not exists listings_created_idx on public.listings (created_at desc);

alter table public.listings enable row level security;

create policy "listings public read"
  on public.listings for select
  using (true);

create policy "listings host write own"
  on public.listings for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- ---------------------------------------------------------------------------
-- listing_photos
-- ---------------------------------------------------------------------------
create table if not exists public.listing_photos (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  url         text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists listing_photos_listing_idx on public.listing_photos (listing_id, position);

alter table public.listing_photos enable row level security;

create policy "photos public read"
  on public.listing_photos for select
  using (true);

create policy "photos host write own"
  on public.listing_photos for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete restrict,
  guest_id    uuid not null references public.profiles(id) on delete cascade,
  start_date  date not null,
  end_date    date not null check (end_date > start_date),
  total_cents integer not null check (total_cents >= 0),
  status      text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at  timestamptz not null default now()
);

create index if not exists bookings_guest_idx on public.bookings (guest_id, start_date desc);
create index if not exists bookings_listing_idx on public.bookings (listing_id, start_date);

alter table public.bookings enable row level security;

create policy "bookings guest read own"
  on public.bookings for select
  using (auth.uid() = guest_id);

create policy "bookings host read own listings"
  on public.bookings for select
  using (exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid()));

create policy "bookings guest insert own"
  on public.bookings for insert
  with check (auth.uid() = guest_id);

create policy "bookings guest update own"
  on public.bookings for update
  using (auth.uid() = guest_id)
  with check (auth.uid() = guest_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  guest_id    uuid not null references public.profiles(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_listing_idx on public.reviews (listing_id, created_at desc);

alter table public.reviews enable row level security;

create policy "reviews public read"
  on public.reviews for select
  using (true);

create policy "reviews guest write own"
  on public.reviews for all
  using (auth.uid() = guest_id)
  with check (auth.uid() = guest_id);

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "favorites self read"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "favorites self write"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
