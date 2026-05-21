// Host listings — REAL create / read-own / update / delete against Supabase.
//
// Distinct from ./host.ts's `useHostListings` (synthetic preview). These hooks
// operate on the signed-in user's own listings via the `listings` +
// `listing_photos` tables. RLS ("listings host write own") enforces
// auth.uid() = host_id, so a user can only touch their own rows.
//
// Photos here are stored as URLs (paste a public image URL). Real file upload
// arrives with the Supabase Storage bucket (M17).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Listing } from '@bnb/db';
import { getSupabase, tryGetSupabase } from './client';

const LISTING_COLUMNS = `
  id, host_id, title, description, price_cents, currency, property_type,
  bedrooms, bathrooms, max_guests, address, city, country, lat, lng,
  amenities, rating_avg, rating_count, created_at,
  photos:listing_photos ( id, listing_id, url, position )
`;

export type ListingInput = {
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  city: string;
  country: string;
  address?: string;
  lat?: number;
  lng?: number;
  amenities: string[];
  photo_urls?: string[];
};

/** Listings owned by the signed-in user. Empty when not signed in / no Supabase. */
export async function fetchMyListings(): Promise<Listing[]> {
  const supabase = tryGetSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Listing[]).map((l) => ({
    ...l,
    photos: (l.photos ?? []).slice().sort((a, b) => a.position - b.position),
  }));
}

export function useMyListings() {
  return useQuery({ queryKey: ['my-listings'], queryFn: fetchMyListings, staleTime: 30_000 });
}

function invalidateListings(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['my-listings'] });
  qc.invalidateQueries({ queryKey: ['listings'] }); // home feed
  qc.invalidateQueries({ queryKey: ['host-dashboard'] });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ListingInput): Promise<string> => {
      const supabase = getSupabase(); // throws if unconfigured → surfaced by UI
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to create a listing.');

      const { data, error } = await supabase
        .from('listings')
        .insert({
          host_id: user.id,
          title: input.title,
          description: input.description,
          price_cents: input.price_cents,
          currency: input.currency,
          property_type: input.property_type,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          max_guests: input.max_guests,
          address: input.address ?? '',
          city: input.city,
          country: input.country,
          lat: input.lat ?? 0,
          lng: input.lng ?? 0,
          amenities: input.amenities,
        })
        .select('id')
        .single();
      if (error) throw error;
      const listingId = (data as { id: string }).id;

      const urls = (input.photo_urls ?? []).filter((u) => u.trim().length > 0);
      if (urls.length > 0) {
        const rows = urls.map((url, i) => ({ listing_id: listingId, url: url.trim(), position: i }));
        const { error: pErr } = await supabase.from('listing_photos').insert(rows);
        if (pErr) throw pErr;
      }
      return listingId;
    },
    onSuccess: () => invalidateListings(qc),
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ListingInput> }) => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to edit a listing.');
      // Only column fields (photos handled separately if ever needed).
      const { photo_urls: _ignore, ...cols } = patch;
      void _ignore;
      const { error } = await supabase
        .from('listings')
        .update(cols)
        .eq('id', id)
        .eq('host_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => invalidateListings(qc),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to delete a listing.');
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('host_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => invalidateListings(qc),
  });
}
