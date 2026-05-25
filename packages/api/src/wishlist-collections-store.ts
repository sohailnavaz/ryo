'use client';

// Client-side store for named wishlist collections (v2-preview).
//
// Today the platform has one flat set of favourites (see ./favorites.ts, backed
// by the `favorites` table). This store layers *named lists* on top — create /
// rename / delete a list, and assign a saved listing to one or more lists — so a
// guest can organise saves ("Tokyo trip", "Someday") the way they do on other
// stay apps. The real version will be a `wishlists` + `wishlist_items` schema
// with RLS; until that lands membership is persisted client-side here.
//
// Membership is purely additive on top of favourites: removing a listing from a
// list does NOT unfavourite it, and the existing flat favourites keep working
// untouched. A listing can live in zero, one, or many lists.
//
// Same pattern as ./admin-store.ts / ./incident-store.ts — a module singleton
// backed by `useSyncExternalStore` + localStorage.

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bnb.wishlist-collections';

export type WishlistCollection = {
  id: string;
  name: string;
  created_at: string;
  /** Listing ids saved into this list. Order = insertion order (newest last). */
  listing_ids: string[];
};

export type WishlistCollectionState = {
  collections: WishlistCollection[];
};

const EMPTY: WishlistCollectionState = { collections: [] };

let cached: WishlistCollectionState = readStorage();
const listeners = new Set<() => void>();

function readStorage(): WishlistCollectionState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<WishlistCollectionState>;
    return {
      collections: (parsed.collections ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        created_at: c.created_at,
        listing_ids: c.listing_ids ?? [],
      })),
    };
  } catch {
    return EMPTY;
  }
}

function writeStorage(s: WishlistCollectionState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // best-effort
  }
}

function commit(next: WishlistCollectionState) {
  cached = next;
  writeStorage(next);
  listeners.forEach((l) => l());
}

function newId(): string {
  return `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// --- mutators ---------------------------------------------------------------

/** Create a new named list. Returns the new collection id. */
export function createCollection(name: string, seedListingId?: string): string {
  const id = newId();
  const collection: WishlistCollection = {
    id,
    name: name.trim() || 'Untitled list',
    created_at: new Date().toISOString(),
    listing_ids: seedListingId ? [seedListingId] : [],
  };
  commit({ collections: [...cached.collections, collection] });
  return id;
}

export function renameCollection(id: string, name: string): void {
  commit({
    collections: cached.collections.map((c) =>
      c.id === id ? { ...c, name: name.trim() || c.name } : c,
    ),
  });
}

export function deleteCollection(id: string): void {
  commit({ collections: cached.collections.filter((c) => c.id !== id) });
}

/** Add a listing to a list (idempotent). */
export function addToCollection(collectionId: string, listingId: string): void {
  commit({
    collections: cached.collections.map((c) =>
      c.id === collectionId && !c.listing_ids.includes(listingId)
        ? { ...c, listing_ids: [...c.listing_ids, listingId] }
        : c,
    ),
  });
}

/** Remove a listing from a list. Does NOT unfavourite it. */
export function removeFromCollection(collectionId: string, listingId: string): void {
  commit({
    collections: cached.collections.map((c) =>
      c.id === collectionId
        ? { ...c, listing_ids: c.listing_ids.filter((id) => id !== listingId) }
        : c,
    ),
  });
}

export function resetWishlistCollections(): void {
  commit(EMPTY);
}

// --- reads ------------------------------------------------------------------

export function getCollections(): WishlistCollection[] {
  return cached.collections;
}

/** Ids of the lists a given listing currently lives in. */
export function collectionsForListing(listingId: string): string[] {
  return cached.collections.filter((c) => c.listing_ids.includes(listingId)).map((c) => c.id);
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): WishlistCollectionState {
  return cached;
}

function serverSnapshot(): WishlistCollectionState {
  return EMPTY;
}

export function useWishlistCollections(): WishlistCollection[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot).collections;
}
