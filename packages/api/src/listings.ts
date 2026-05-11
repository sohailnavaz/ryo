import { useQuery } from '@tanstack/react-query';
import type { Listing } from '@bnb/db';
import { getSupabase, isSupabaseUnavailableError } from './client';
import type { SearchFilters } from './filters';
import { DUMMY_LISTINGS, findDummyListing } from './dummy-listings';

const LISTING_COLUMNS = `
  id, host_id, title, description, price_cents, currency, property_type,
  bedrooms, bathrooms, max_guests, address, city, country, lat, lng,
  amenities, rating_avg, rating_count, created_at,
  photos:listing_photos ( id, listing_id, url, position )
`;

/**
 * In production we MUST NOT silently serve dummy listings — that would mask a
 * misconfigured Supabase deploy. In dev / preview we keep the fallback so the
 * demo works without a live backend.
 *
 * Explicit escape hatch for hosted-preview deploys (e.g. a Vercel link shared
 * with friends / investors before the real Supabase project is wired):
 * set NEXT_PUBLIC_RYO_PREVIEW_MODE=1. With that on, dummy listings are served
 * in production too. Without it, prod hard-fails so a real misconfiguration
 * can never sneak through.
 */
function isProduction(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (globalThis as any)?.process?.env;
  return env?.NODE_ENV === 'production';
}

function isPreviewMode(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (globalThis as any)?.process?.env;
  return env?.NEXT_PUBLIC_RYO_PREVIEW_MODE === '1' || env?.NEXT_PUBLIC_RYO_PREVIEW_MODE === 'true';
}

function dummyOrThrow<T>(value: T, context: string): T {
  if (isProduction() && !isPreviewMode()) {
    throw new Error(
      `[@bnb/api] ${context} — Supabase is not configured but NODE_ENV=production. ` +
        `Refusing to serve dummy data. Wire NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, ` +
        `or set NEXT_PUBLIC_RYO_PREVIEW_MODE=1 to opt in to dummy data on this deploy.`,
    );
  }
  return value;
}

function applyFiltersLocal(listings: Listing[], f: SearchFilters): Listing[] {
  let out = listings;
  if (f.category && f.category !== 'All') {
    out = out.filter((l) => l.amenities.includes(f.category as string));
  }
  if (f.destination) {
    const q = f.destination.toLowerCase();
    out = out.filter(
      (l) =>
        l.city.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q),
    );
  }
  if (f.guests) out = out.filter((l) => l.max_guests >= (f.guests as number));
  if (f.minPrice) out = out.filter((l) => l.price_cents >= (f.minPrice as number) * 100);
  if (f.maxPrice) out = out.filter((l) => l.price_cents <= (f.maxPrice as number) * 100);
  if (f.bedrooms) out = out.filter((l) => l.bedrooms >= (f.bedrooms as number));
  if (f.propertyTypes && f.propertyTypes.length > 0) {
    out = out.filter((l) => (f.propertyTypes as string[]).includes(l.property_type));
  }
  if (f.amenities && f.amenities.length > 0) {
    out = out.filter((l) => (f.amenities as string[]).every((a) => l.amenities.includes(a)));
  }
  return out;
}

export async function fetchListings(filters: SearchFilters = {}): Promise<Listing[]> {
  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    if (isSupabaseUnavailableError(err)) {
      return dummyOrThrow(applyFiltersLocal(DUMMY_LISTINGS, filters), 'fetchListings');
    }
    throw err;
  }

  let q = supabase
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
  const rows = ((data ?? []) as unknown as Listing[]).map((l) => ({
    ...l,
    photos: (l.photos ?? []).slice().sort((a, b) => a.position - b.position),
  }));
  // If the project is wired but the table is empty, fall back so the demo still works.
  // In prod this is also a misconfiguration — fail loudly instead.
  if (rows.length === 0) {
    return dummyOrThrow(applyFiltersLocal(DUMMY_LISTINGS, filters), 'fetchListings (empty live table)');
  }
  return rows;
}

export async function fetchListing(id: string): Promise<Listing | null> {
  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    if (isSupabaseUnavailableError(err)) {
      return dummyOrThrow(findDummyListing(id), 'fetchListing');
    }
    throw err;
  }

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    // Found nothing in live DB; in dev allow the dummy fallback, in prod return null
    // (genuine 404 — listing actually doesn't exist). Preview-mode behaves like dev.
    return isProduction() && !isPreviewMode() ? null : findDummyListing(id);
  }
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
