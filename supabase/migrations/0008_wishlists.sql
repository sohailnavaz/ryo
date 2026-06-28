-- 0008_wishlists.sql — named wishlist collections (replaces the single flat
-- favorites set with Airbnb-style multiple named lists).
--
-- Replaces the client-side `wishlist-collections-store.ts` localStorage layer.
-- `wishlists` holds the named list; `wishlist_items` is the membership junction
-- (a listing can belong to many lists). The flat `favorites` table stays for the
-- heart toggle; collections are the richer, organised layer on top.

create table if not exists public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null check (length(name) > 0),
  created_at timestamptz not null default now()
);

create index if not exists wishlists_owner_idx on public.wishlists (owner_id, created_at desc);

alter table public.wishlists enable row level security;

create policy "wishlists owner read"
  on public.wishlists for select
  using (auth.uid() = owner_id);

create policy "wishlists owner write"
  on public.wishlists for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- wishlist_items — listing membership in a list
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (wishlist_id, listing_id)
);

alter table public.wishlist_items enable row level security;

-- Membership is readable/writable only by the owner of the parent wishlist.
create policy "wishlist_items owner read"
  on public.wishlist_items for select
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.owner_id = auth.uid()));

create policy "wishlist_items owner write"
  on public.wishlist_items for all
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.owner_id = auth.uid()));
