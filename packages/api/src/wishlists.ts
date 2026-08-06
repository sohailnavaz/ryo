'use client';

// Named wishlist collections — real when signed in, localStorage otherwise.
//
// Same dual-path shape as host-calendar.ts: a signed-in guest reads/writes the real
// `wishlist_collections` + `wishlist_items` tables (RLS-scoped to them); an anonymous
// or demo visitor falls through to the localStorage store so the feature is still
// demonstrable. When the table is missing (migration not yet applied) it also falls
// through — so nothing breaks before 0012 lands.
//
// The React surface (`useWishlistCollections`, the mutators) keeps the store's exact
// shape, so FavoritesScreen / SaveToCollectionSheet barely change.

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tryGetSupabase } from './client';
import { useSession } from './auth';
import {
  useWishlistCollections as useLocalCollections,
  createCollection as localCreate,
  renameCollection as localRename,
  deleteCollection as localDelete,
  addToCollection as localAdd,
  removeFromCollection as localRemove,
  type WishlistCollection,
} from './wishlist-collections-store';

export type { WishlistCollection } from './wishlist-collections-store';

const KEY = ['wishlist-collections'];

function missingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return e?.code === '42P01' || /does not exist|could not find the table/i.test(e?.message ?? '');
}

async function fetchReal(): Promise<WishlistCollection[] | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) return null; // not a real session → caller uses the local store

  const { data, error } = await supabase
    .from('wishlist_collections')
    .select('id, name, created_at, wishlist_items ( listing_id, added_at )')
    .eq('owner_id', uid)
    .order('created_at');

  if (error) {
    if (missingTable(error)) return null; // migration not applied yet → local store
    throw error;
  }

  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
    created_at: c.created_at as string,
    listing_ids: ((c.wishlist_items as Array<{ listing_id: string; added_at: string }>) ?? [])
      .slice()
      .sort((a, b) => a.added_at.localeCompare(b.added_at))
      .map((i) => i.listing_id),
  }));
}

/**
 * The list of collections. Uses the real tables when a real session + table exist,
 * otherwise the localStorage store. `isReal` tells the UI which path is live.
 */
export function useWishlistCollections(): {
  collections: WishlistCollection[];
  isReal: boolean;
} {
  const { user } = useSession();
  const isDemo = (user?.app_metadata as { demo?: boolean } | undefined)?.demo === true;
  const canBeReal = Boolean(user) && !isDemo && Boolean(tryGetSupabase());

  const local = useLocalCollections();
  const { data } = useQuery({
    queryKey: [...KEY, user?.id ?? 'anon'],
    enabled: canBeReal,
    queryFn: fetchReal,
    staleTime: 30_000,
  });

  // data === null means "fall through to local" (no session / no table).
  if (canBeReal && data) return { collections: data, isReal: true };
  return { collections: local, isReal: false };
}

// --- mutations --------------------------------------------------------------
//
// Each tries the real path first (signed in + table present) and falls back to the
// local store. All invalidate the query so the list re-reads.

function useReal() {
  const { user } = useSession();
  const isDemo = (user?.app_metadata as { demo?: boolean } | undefined)?.demo === true;
  return Boolean(user) && !isDemo && Boolean(tryGetSupabase());
}

export function useCreateCollection() {
  const qc = useQueryClient();
  const real = useReal();
  return useMutation({
    mutationFn: async ({ name, seedListingId }: { name: string; seedListingId?: string }) => {
      if (!real) return localCreate(name, seedListingId);
      const supabase = tryGetSupabase()!;
      const { data: s } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('wishlist_collections')
        .insert({ owner_id: s.user!.id, name })
        .select('id')
        .single();
      if (error) {
        if (missingTable(error)) return localCreate(name, seedListingId);
        throw error;
      }
      const id = (data as { id: string }).id;
      if (seedListingId) {
        await supabase.from('wishlist_items').insert({ collection_id: id, listing_id: seedListingId });
      }
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRenameCollection() {
  const qc = useQueryClient();
  const real = useReal();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!real) return localRename(id, name);
      const supabase = tryGetSupabase()!;
      const { error } = await supabase.from('wishlist_collections').update({ name }).eq('id', id);
      if (error && !missingTable(error)) throw error;
      if (error) localRename(id, name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  const real = useReal();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!real) return localDelete(id);
      const supabase = tryGetSupabase()!;
      const { error } = await supabase.from('wishlist_collections').delete().eq('id', id);
      if (error && !missingTable(error)) throw error;
      if (error) localDelete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleInCollection() {
  const qc = useQueryClient();
  const real = useReal();
  return useMutation({
    mutationFn: async ({
      collectionId,
      listingId,
      add,
    }: {
      collectionId: string;
      listingId: string;
      add: boolean;
    }) => {
      if (!real) return add ? localAdd(collectionId, listingId) : localRemove(collectionId, listingId);
      const supabase = tryGetSupabase()!;
      const q = add
        ? supabase.from('wishlist_items').upsert({ collection_id: collectionId, listing_id: listingId })
        : supabase
            .from('wishlist_items')
            .delete()
            .eq('collection_id', collectionId)
            .eq('listing_id', listingId);
      const { error } = await q;
      if (error && !missingTable(error)) throw error;
      if (error) add ? localAdd(collectionId, listingId) : localRemove(collectionId, listingId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Which collections contain a listing — for the "saved" state on a card. */
export function useCollectionsForListing(listingId: string): string[] {
  const { collections } = useWishlistCollections();
  return collections.filter((c) => c.listing_ids.includes(listingId)).map((c) => c.id);
}
