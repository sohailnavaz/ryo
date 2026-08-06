'use client';

// Saved searches — persist the current explore filters and get notified when a
// new listing matches (trigger in 0023_saved_searches.sql calls notify()).
//
// Reads/writes the `saved_searches` table for a real signed-in user; returns
// null / no-ops for demo / unconfigured sessions (mirrors notifications-store's
// `realUserId` gate) so the UI degrades cleanly instead of throwing.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchFilters } from './filters';
import { getSupabase, tryGetSupabase } from './client';

export type SavedSearch = {
  id: string;
  label: string;
  destination: string | null;
  guests: number | null;
  min_price_cents: number | null;
  max_price_cents: number | null;
  property_types: string[] | null;
  notify: boolean;
  created_at: string;
};

async function realUserId(): Promise<string | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if ((user.app_metadata as { demo?: boolean } | undefined)?.demo === true) return null;
  return user.id;
}

const SAVED_SEARCHES_KEY = ['saved-searches'] as const;

/** This user's saved searches (newest first), or null with no real session. */
export async function fetchSavedSearches(): Promise<SavedSearch[] | null> {
  const uid = await realUserId();
  if (!uid) return null;
  const { data, error } = await getSupabase()
    .from('saved_searches')
    .select('id, label, destination, guests, min_price_cents, max_price_cents, property_types, notify, created_at')
    .eq('profile_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSearch[];
}

export function useSavedSearches() {
  return useQuery({ queryKey: SAVED_SEARCHES_KEY, queryFn: fetchSavedSearches, staleTime: 30_000 });
}

/** A concise human label for a set of filters, e.g. "Goa · 2 guests · under ₹300". */
export function describeFilters(f: SearchFilters): string {
  const parts: string[] = [];
  if (f.destination) parts.push(f.destination);
  if (f.guests) parts.push(`${f.guests} guest${f.guests === 1 ? '' : 's'}`);
  if (f.minPrice && f.maxPrice) parts.push(`${f.minPrice}–${f.maxPrice}/night`);
  else if (f.maxPrice) parts.push(`under ${f.maxPrice}/night`);
  else if (f.minPrice) parts.push(`over ${f.minPrice}/night`);
  if (f.propertyTypes && f.propertyTypes.length) parts.push(f.propertyTypes.join(', '));
  return parts.length ? parts.join(' · ') : 'Anywhere';
}

/** Filters that are actually savable/matchable (destination / price / capacity / type). */
export function filtersAreSavable(f: SearchFilters): boolean {
  return !!(f.destination || f.guests || f.minPrice || f.maxPrice || (f.propertyTypes && f.propertyTypes.length));
}

/** True when there's a real session that can persist a saved search. */
export async function canSaveSearch(): Promise<boolean> {
  return (await realUserId()) !== null;
}

export function useSaveSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filters: SearchFilters): Promise<'saved' | 'no-session'> => {
      const uid = await realUserId();
      if (!uid) return 'no-session';
      const { error } = await getSupabase().from('saved_searches').insert({
        profile_id: uid,
        label: describeFilters(filters),
        destination: filters.destination ?? null,
        guests: filters.guests ?? null,
        // Filter prices are major units; the table + listings.price_cents are cents.
        min_price_cents: filters.minPrice != null ? Math.round(filters.minPrice * 100) : null,
        max_price_cents: filters.maxPrice != null ? Math.round(filters.maxPrice * 100) : null,
        property_types: filters.propertyTypes && filters.propertyTypes.length ? filters.propertyTypes : null,
        notify: true,
      });
      if (error) throw error;
      return 'saved';
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAVED_SEARCHES_KEY }),
  });
}

export function useDeleteSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = await realUserId();
      if (!uid) return;
      const { error } = await getSupabase()
        .from('saved_searches')
        .delete()
        .eq('id', id)
        .eq('profile_id', uid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAVED_SEARCHES_KEY }),
  });
}

/** Reconstruct explore filters from a saved search (to re-run it). */
export function savedSearchToFilters(s: SavedSearch): SearchFilters {
  return {
    destination: s.destination ?? undefined,
    guests: s.guests ?? undefined,
    minPrice: s.min_price_cents != null ? Math.round(s.min_price_cents / 100) : undefined,
    maxPrice: s.max_price_cents != null ? Math.round(s.max_price_cents / 100) : undefined,
    propertyTypes: s.property_types ?? undefined,
  };
}
