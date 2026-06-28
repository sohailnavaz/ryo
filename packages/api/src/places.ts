import { useQuery } from '@tanstack/react-query';
import { tryGetSupabase } from './client';
import { searchPlacesLocal, type PlaceOption } from './places-data';

/**
 * Destination search for the explore/filter UI.
 *
 * Two-tier, by design:
 *  1. **Live (exhaustive):** if a Supabase client is initialized, query the
 *     `search_places` RPC — a trigram/prefix search over the full `places`
 *     table (seeded from GeoNames; hundreds of thousands of cities worldwide).
 *  2. **Offline fallback:** otherwise (or if the RPC errors), fall back to the
 *     curated in-bundle dataset (`searchPlacesLocal`) so the field always works
 *     — in dev, in preview, and with zero connectivity.
 *
 * Both tiers return the same {@link PlaceOption} shape, so the UI never has to
 * branch on the source.
 */

/** One row as returned by the `search_places` Postgres RPC. */
type PlaceRow = {
  name: string;
  country: string;
  country_code: string;
  admin1: string | null;
  kind: 'city' | 'country';
  population: number | null;
};

function rowToOption(r: PlaceRow): PlaceOption {
  const label =
    r.kind === 'country' ? r.country : `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}, ${r.country}`;
  const sub = r.kind === 'country' ? r.country_code : r.country;
  return {
    label,
    sub,
    haystack: `${label} ${sub}`.toLowerCase(),
    code: r.country_code?.toUpperCase() ?? '',
    // Higher population → lower (better) rank bucket; countries sit mid-list.
    rank: r.kind === 'country' ? 2 : r.population && r.population > 1_000_000 ? 1 : 3,
    kind: r.kind,
  };
}

/**
 * Resolve destination suggestions for `query`. Async so callers (and the
 * `usePlacesSearch` hook) get the live DB results when available without
 * needing to know which tier answered.
 */
export async function searchPlaces(query: string, limit = 8): Promise<PlaceOption[]> {
  const q = query.trim();
  if (q.length === 0) return [];

  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.rpc('search_places', { q, lim: limit });
      if (!error && Array.isArray(data) && data.length > 0) {
        return (data as PlaceRow[]).map(rowToOption);
      }
      // No error but empty result, or RPC missing → fall through to local.
    } catch {
      // Network / RPC failure → fall through to the always-available fallback.
    }
  }

  return searchPlacesLocal(q, limit);
}

/**
 * Popular default suggestions shown when the destination field is focused but
 * empty. Pulled from the curated dataset (top-ranked cities) so there's always
 * something to show instantly, no round-trip required.
 */
export function popularPlaces(limit = 6): PlaceOption[] {
  // searchPlacesLocal with a broad seed won't help here; instead surface the
  // highest-ranked options directly from the curated list via a cheap pass.
  return searchPlacesLocal('a', 100)
    .concat(searchPlacesLocal('e', 100))
    .filter((p) => p.rank <= 1)
    .filter((p, i, arr) => arr.findIndex((x) => x.label === p.label) === i)
    .slice(0, limit);
}

/**
 * TanStack Query hook for debounced destination typeahead. Pass the (already
 * debounced) query string; the hook is disabled for empty input and keeps the
 * previous results visible while the next query loads.
 */
export function usePlacesSearch(query: string, limit = 8) {
  const q = query.trim();
  return useQuery({
    queryKey: ['places', q, limit],
    queryFn: () => searchPlaces(q, limit),
    enabled: q.length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
