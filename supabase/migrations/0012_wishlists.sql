-- 0012_wishlists.sql — named wishlist collections, for real.
--
-- Airbnb's signature "save to a list" feature was localStorage-only: a guest's lists
-- lived on one browser and vanished on their phone. This makes them real, RLS-scoped
-- to the owner. The API (packages/api/src/wishlists.ts) dual-paths — real when signed
-- in, the localStorage store otherwise — so the demo keeps working.

create table if not exists public.wishlist_collections (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create index if not exists wishlist_collections_owner_idx
  on public.wishlist_collections (owner_id, created_at);

create table if not exists public.wishlist_items (
  collection_id uuid not null references public.wishlist_collections(id) on delete cascade,
  listing_id    uuid not null references public.listings(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, listing_id)
);

alter table public.wishlist_collections enable row level security;
alter table public.wishlist_items       enable row level security;

-- A guest sees and edits only their own lists.
drop policy if exists "wishlist_collections own" on public.wishlist_collections;
create policy "wishlist_collections own" on public.wishlist_collections for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Items are reachable only through a collection the caller owns.
drop policy if exists "wishlist_items own" on public.wishlist_items;
create policy "wishlist_items own" on public.wishlist_items for all
  using (exists (
    select 1 from public.wishlist_collections c
     where c.id = collection_id and c.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.wishlist_collections c
     where c.id = collection_id and c.owner_id = auth.uid()
  ));

-- Grants (explicit — see 0007). Owner-scoped, so full CRUD to authenticated.
grant select, insert, update, delete on public.wishlist_collections to authenticated;
grant select, insert, delete         on public.wishlist_items       to authenticated;
revoke all on public.wishlist_collections from anon;
revoke all on public.wishlist_items       from anon;
