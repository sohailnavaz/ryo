import { useQuery } from '@tanstack/react-query';
import type { Listing } from '@bnb/db';
import { getSupabase } from './client';
import type { SearchFilters } from './filters';

const LISTING_COLUMNS = `
  id, host_id, title, description, price_cents, currency, property_type,
  bedrooms, bathrooms, max_guests, address, city, country, lat, lng,
  amenities, rating_avg, rating_count, created_at,
  photos:listing_photos ( id, listing_id, url, position )
`;

export async function fetchListings(filters: SearchFilters = {}): Promise<Listing[]> {
  let q = getSupabase()
    .from('listings')
    .select(LISTING_COLUMNS)
    .order('created_at', { ascending: false });

  if (filters.category && filters.category !== 'All') {
    q = q.contains('amenities', [filters.category]);
  }
  if (filters.destination) {
    q = q.or(
      `city.ilike.%${filters.destination}%,country.ilike.%${filters.destination}%,title.ilike.%${filters.destination}%`,
    );
  }
  if (filters.guests) q = q.gte('max_guests', filters.guests);
  if (filters.minPrice) q = q.gte('price_cents', filters.minPrice * 100);
  if (filters.maxPrice) q = q.lte('price_cents', filters.maxPrice * 100);
  if (filters.bedrooms) q = q.gte('bedrooms', filters.bedrooms);
  if (filters.propertyTypes && filters.propertyTypes.length > 0) {
    q = q.in('property_type', filters.propertyTypes);
  }
  if (filters.amenities && filters.amenities.length > 0) {
    q = q.contains('amenities', filters.amenities);
  }

  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as Listing[]).map((l) => ({
    ...l,
    photos: (l.photos ?? []).slice().sort((a, b) => a.position - b.position),
  }));
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const { data, error } = await getSupabase()
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const l = data as unknown as Listing;
  return { ...l, photos: (l.photos ?? []).slice().sort((a, b) => a.position - b.position) };
}

export function useListings(filters: SearchFilters = {}) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => fetchListings(filters),
    staleTime: 60_000,
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}
