// Location autofill for listing create / edit.
//
// Uses Photon (https://photon.komoot.io) — an OpenStreetMap-based geocoder built
// for search-as-you-type. No API key, and no Google Maps Platform terms to
// comply with (which restrict caching/storing place data). Data is © OpenStreetMap
// contributors (ODbL) — attributed in the dropdown footer.
//
// The public instance is fine for light use; for production scale, self-host
// Photon and point these env vars at it:
//   • web (Next.js): NEXT_PUBLIC_PHOTON_URL
//   • mobile (Expo):  EXPO_PUBLIC_PHOTON_URL
// One request returns geometry + address parts, so there's no second lookup.

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Input, Pressable, Skeleton, Text, VStack } from '@bnb/ui';

export type ResolvedPlace = {
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

type Suggestion = { id: string; primary: string; secondary: string; place: ResolvedPlace };

function photonUrl(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (globalThis as any)?.process?.env ?? {};
  return env.NEXT_PUBLIC_PHOTON_URL || env.EXPO_PUBLIC_PHOTON_URL || 'https://photon.komoot.io';
}

/** Autocomplete is always available now (no key needed). Kept for compatibility. */
export function placesEnabled(): boolean {
  return true;
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }; // [lng, lat]
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    osm_id?: number;
    osm_type?: string;
  };
};

function toSuggestion(f: PhotonFeature, i: number): Suggestion | null {
  const p = f.properties ?? {};
  const coords = f.geometry?.coordinates;
  if (!coords) return null;
  const [lng, lat] = coords;
  const city = p.city || p.town || p.village || p.district || p.county || p.state || '';
  const country = p.country || '';
  const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ');
  const primary = p.name || streetLine || city || 'Location';
  const secondary = Array.from(
    new Set([streetLine, p.postcode, city, p.state, country].filter((x): x is string => !!x)),
  )
    .filter((x) => x !== primary)
    .join(', ');
  const address =
    [streetLine !== primary ? streetLine : '', p.postcode, city, p.state, country]
      .filter(Boolean)
      .join(', ') || primary;
  return {
    id: `${p.osm_type ?? 't'}${p.osm_id ?? i}`,
    primary,
    secondary,
    place: { address, city, country, lat, lng },
  };
}

async function fetchSuggestions(input: string): Promise<Suggestion[]> {
  const url = `${photonUrl()}/api/?q=${encodeURIComponent(input)}&limit=6&lang=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoder failed (${res.status})`);
  const json = (await res.json()) as { features?: PhotonFeature[] };
  return (json.features ?? [])
    .map((f, i) => toSuggestion(f, i))
    .filter((s): s is Suggestion => !!s);
}

export function AddressAutocomplete({
  onResolved,
  label = 'Search address',
}: {
  onResolved: (place: ResolvedPlace) => void;
  label?: string;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Suppress the next debounced fetch right after a selection fills the input.
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const next = await fetchSuggestions(q);
        if (!cancelled) {
          setSuggestions(next);
          setOpen(next.length > 0);
        }
      } catch {
        // Network / rate limit — fail quiet, manual entry still works.
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350); // debounce (Photon fair-use)
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const pick = (s: Suggestion) => {
    setOpen(false);
    skipNext.current = true;
    setQuery(s.secondary ? `${s.primary}, ${s.secondary}` : s.primary);
    onResolved(s.place);
  };

  return (
    <VStack className="gap-1.5">
      <Text variant="small" className="text-ink-soft font-semibold">
        {label}
      </Text>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Start typing an address or place…"
        autoCapitalize="none"
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open ? (
        <View className="rounded-xl border border-surface-border bg-surface overflow-hidden">
          {suggestions.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => pick(s)}
              className={`px-3 py-2.5 ${i > 0 ? 'border-t border-surface-border' : ''}`}
            >
              <Text variant="small" className="font-semibold">
                {s.primary}
              </Text>
              {s.secondary ? (
                <Text variant="caption" className="text-ink-soft">
                  {s.secondary}
                </Text>
              ) : null}
            </Pressable>
          ))}
          {loading && suggestions.length === 0 ? (
            <View className="px-3 py-2.5">
              <Text variant="caption" className="text-ink-soft">
                Searching…
              </Text>
            </View>
          ) : (
            <View className="px-3 py-1.5 border-t border-surface-border bg-surface-alt">
              <Text variant="caption" className="text-ink-muted">
                © OpenStreetMap contributors
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </VStack>
  );
}
