'use client';

// Real (Supabase-backed) named wishlist collections, with the localStorage demo
// store as a fall-back.
//
// Schema (migrated separately):
//   wishlists       (id, owner_id → profiles, name, created_at)   RLS: owner only
//   wishlist_items  (wishlist_id → wishlists, listing_id → listings, added_at)
//                   PK (wishlist_id, listing_id)                  RLS: owner of parent
//
// The localStorage store in ./wishlist-collections-store.ts is kept intact: when
// there is NO real signed-in Supabase user (demo mode / unconfigured env) every
// operation routes through it, so demo accounts keep working exactly as before.
// When there IS a real user, CRUD runs against the two tables above and rows are
// mapped back into the existing `WishlistCollection` shape so consumers don't
// need to change their data model.
//
// Read path uses `tryGetSupabase()`; writes use `getSupabase()` — same pattern as
// ./bookings.ts and ./favorites.ts.

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';
import {
  addToCollection as storeAddToCollection,
  createCollection as storeCreateCollection,
  deleteCollection as storeDeleteCollection,
  removeFromCollection as storeRemoveFromCollection,
  renameCollection as storeRenameCollection,
  useWishlistCollections as useStoreWishlistCollections,
  type WishlistCollection,
} from './wishlist-collections-store';

const WISHLISTS_KEY = ['wishlists'] as const;

/** Resolve the real signed-in Supabase user id, or null (demo / unconfigured). */
async function realUserId(): Promise<string | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

type WishlistRow = { id: string; name: string; created_at: string };
type WishlistItemRow = { wishlist_id: string; listing_id: string; added_at: string };

/** Fetch the current real user's wishlists + items, mapped to `WishlistCollection[]`.
 *  Returns null when there is no real user (signals the caller to use the store). */
export async function fetchWishlistCollections(): Promise<WishlistCollection[] | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const uid = await realUserId();
  if (!uid) return null;

  const { data: lists, error: listsErr } = await supabase
    .from('wishlists')
    .select('id, name, created_at')
    .eq('owner_id', uid)
    .order('created_at', { ascending: true });
  if (listsErr) throw listsErr;

  const rows = (lists ?? []) as WishlistRow[];
  if (rows.length === 0) return [];

  const { data: items, error: itemsErr } = await supabase
    .from('wishlist_items')
    .select('wishlist_id, listing_id, added_at')
    .in(
      'wishlist_id',
      rows.map((r) => r.id),
    )
    .order('added_at', { ascending: true });
  if (itemsErr) throw itemsErr;

  const byList = new Map<string, string[]>();
  for (const it of (items ?? []) as WishlistItemRow[]) {
    const arr = byList.get(it.wishlist_id) ?? [];
    arr.push(it.listing_id);
    byList.set(it.wishlist_id, arr);
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    created_at: r.created_at,
    listing_ids: byList.get(r.id) ?? [],
  }));
}

/** The set of CRUD mutators a consumer needs, regardless of backing store. */
export type WishlistCollectionsApi = {
  collections: WishlistCollection[];
  isLoading: boolean;
  /** True when collections are backed by a real Supabase user (vs. the demo store). */
  isReal: boolean;
  /** Create a list (optionally seeding one listing). Resolves to the new list id. */
  createCollection: (name: string, seedListingId?: string) => Promise<string>;
  renameCollection: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (collectionId: string, listingId: string) => Promise<void>;
  removeFromCollection: (collectionId: string, listingId: string) => Promise<void>;
  /** Ids of the lists a given listing currently lives in. */
  collectionsForListing: (listingId: string) => string[];
};

/**
 * Unified hook for named wishlist collections.
 *
 * When a real Supabase user is signed in, reads/writes hit `wishlists` +
 * `wishlist_items`. Otherwise everything falls through to the localStorage store
 * so demo accounts keep working. The returned mutators are always async so call
 * sites are identical across both paths (store writes resolve immediately).
 */
export function useWishlistCollectionsApi(): WishlistCollectionsApi {
  const qc = useQueryClient();

  // Real path: server collections. `data === null` means "no real user".
  const query = useQuery({
    queryKey: WISHLISTS_KEY,
    queryFn: fetchWishlistCollections,
    staleTime: 30_000,
  });

  // Demo path: the localStorage store (always subscribed; cheap when unused).
  const storeCollections = useStoreWishlistCollections();

  const isReal = query.data != null;
  const collections = isReal ? (query.data as WishlistCollection[]) : storeCollections;

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: WISHLISTS_KEY });
  }, [qc]);

  const createCollection = useCallback(
    async (name: string, seedListingId?: string): Promise<string> => {
      const uid = await realUserId();
      if (!uid) return storeCreateCollection(name, seedListingId);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('wishlists')
        .insert({ owner_id: uid, name: name.trim() || 'Untitled list' })
        .select('id')
        .single();
      if (error) throw error;
      const id = (data as { id: string }).id;
      if (seedListingId) {
        const { error: itemErr } = await supabase
          .from('wishlist_items')
          .upsert(
            { wishlist_id: id, listing_id: seedListingId },
            { onConflict: 'wishlist_id,listing_id' },
          );
        if (itemErr) throw itemErr;
      }
      invalidate();
      return id;
    },
    [invalidate],
  );

  const renameCollection = useCallback(
    async (id: string, name: string): Promise<void> => {
      const uid = await realUserId();
      if (!uid) {
        storeRenameCollection(id, name);
        return;
      }
      const trimmed = name.trim();
      if (!trimmed) return;
      const supabase = getSupabase();
      const { error } = await supabase
        .from('wishlists')
        .update({ name: trimmed })
        .eq('id', id)
        .eq('owner_id', uid);
      if (error) throw error;
      invalidate();
    },
    [invalidate],
  );

  const deleteCollection = useCallback(
    async (id: string): Promise<void> => {
      const uid = await realUserId();
      if (!uid) {
        storeDeleteCollection(id);
        return;
      }
      const supabase = getSupabase();
      // Items are removed via ON DELETE CASCADE on the FK; deleting the parent
      // (RLS: owner only) is sufficient.
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', id)
        .eq('owner_id', uid);
      if (error) throw error;
      invalidate();
    },
    [invalidate],
  );

  const addToCollection = useCallback(
    async (collectionId: string, listingId: string): Promise<void> => {
      const uid = await realUserId();
      if (!uid) {
        storeAddToCollection(collectionId, listingId);
        return;
      }
      const supabase = getSupabase();
      const { error } = await supabase
        .from('wishlist_items')
        .upsert(
          { wishlist_id: collectionId, listing_id: listingId },
          { onConflict: 'wishlist_id,listing_id' },
        );
      if (error) throw error;
      invalidate();
    },
    [invalidate],
  );

  const removeFromCollection = useCallback(
    async (collectionId: string, listingId: string): Promise<void> => {
      const uid = await realUserId();
      if (!uid) {
        storeRemoveFromCollection(collectionId, listingId);
        return;
      }
      const supabase = getSupabase();
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', collectionId)
        .eq('listing_id', listingId);
      if (error) throw error;
      invalidate();
    },
    [invalidate],
  );

  const collectionsForListing = useCallback(
    (listingId: string): string[] =>
      collections.filter((c) => c.listing_ids.includes(listingId)).map((c) => c.id),
    [collections],
  );

  return useMemo(
    () => ({
      collections,
      isLoading: query.isLoading,
      isReal,
      createCollection,
      renameCollection,
      deleteCollection,
      addToCollection,
      removeFromCollection,
      collectionsForListing,
    }),
    [
      collections,
      query.isLoading,
      isReal,
      createCollection,
      renameCollection,
      deleteCollection,
      addToCollection,
      removeFromCollection,
      collectionsForListing,
    ],
  );
}
