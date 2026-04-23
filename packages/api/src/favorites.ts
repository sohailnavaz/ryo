import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Listing } from '@bnb/db';
import { getSupabase } from './client';

export async function fetchFavorites(): Promise<Listing[]> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('favorites')
    .select(
      `listing:listings (
        id, host_id, title, description, price_cents, currency, property_type,
        bedrooms, bathrooms, max_guests, address, city, country, lat, lng,
        amenities, rating_avg, rating_count, created_at,
        photos:listing_photos ( id, listing_id, url, position )
      )`,
    )
    .eq('user_id', user.id);
  if (error) throw error;
  return ((data ?? []) as unknown as { listing: Listing }[])
    .map((r) => r.listing)
    .filter(Boolean)
    .map((l) => ({ ...l, photos: (l.photos ?? []).sort((a, b) => a.position - b.position) }));
}

export function useFavorites() {
  return useQuery({ queryKey: ['favorites'], queryFn: fetchFavorites, staleTime: 30_000 });
}

export function useFavoriteIds() {
  return useQuery({
    queryKey: ['favorite-ids'],
    queryFn: async (): Promise<string[]> => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.listing_id);
    },
    staleTime: 30_000,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, on }: { listingId: string; on: boolean }) => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      if (on) {
        const { error } = await supabase
          .from('favorites')
          .upsert({ user_id: user.id, listing_id: listingId }, { onConflict: 'user_id,listing_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['favorite-ids'] });
    },
  });
}
