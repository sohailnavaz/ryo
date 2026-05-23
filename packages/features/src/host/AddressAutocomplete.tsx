// Location autofill for listing create / edit.
//
// Uses the Google Places API (New) — `places.googleapis.com/v1` — which is
// CORS-enabled for browser use with an API key (the classic
// `maps.googleapis.com/maps/api/place/*` endpoints are NOT, and would be blocked
// on web). Works on native too (no CORS there).
//
// The API key is read from an env var, never hardcoded:
//   • web (Next.js): NEXT_PUBLIC_GOOGLE_PLACES_KEY
//   • mobile (Expo):  EXPO_PUBLIC_GOOGLE_PLACES_KEY
// When no key is set, this component renders a short hint and the host fills in
// city / country manually — the form stays fully functional without autofill.

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

type Suggestion = { placeId: string; primary: string; secondary: string };

function placesKey(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (globalThis as any)?.process?.env ?? {};
  return env.NEXT_PUBLIC_GOOGLE_PLACES_KEY || env.EXPO_PUBLIC_GOOGLE_PLACES_KEY || null;
}

export function placesEnabled(): boolean {
  return !!placesKey();
}

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';

async function fetchSuggestions(input: string, key: string): Promise<Suggestion[]> {
  const res = await fetch(AUTOCOMPLETE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error(`Places autocomplete failed (${res.status})`);
  const json = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId: string;
        structuredFormat?: {
          mainText?: { text: string };
          secondaryText?: { text: string };
        };
        text?: { text: string };
      };
    }>;
  };
  return (json.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      placeId: p.placeId,
      primary: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
      secondary: p.structuredFormat?.secondaryText?.text ?? '',
    }));
}

type AddressComponent = { longText: string; shortText: string; types: string[] };

async function fetchDetails(placeId: string, key: string): Promise<ResolvedPlace> {
  const res = await fetch(`${DETAILS_URL}/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'location,formattedAddress,addressComponents',
    },
  });
  if (!res.ok) throw new Error(`Places details failed (${res.status})`);
  const json = (await res.json()) as {
    location?: { latitude: number; longitude: number };
    formattedAddress?: string;
    addressComponents?: AddressComponent[];
  };
  const comps = json.addressComponents ?? [];
  const find = (type: string) => comps.find((c) => c.types.includes(type));
  // Prefer locality; fall back through the admin hierarchy for places that
  // don't return a city (e.g. small towns return postal_town / admin_area_2).
  const city =
    find('locality')?.longText ??
    find('postal_town')?.longText ??
    find('administrative_area_level_2')?.longText ??
    find('administrative_area_level_1')?.longText ??
    '';
  const country = find('country')?.longText ?? '';
  return {
    address: json.formattedAddress ?? '',
    city,
    country,
    lat: json.location?.latitude ?? 0,
    lng: json.location?.longitude ?? 0,
  };
}

export function AddressAutocomplete({
  onResolved,
  label = 'Search address',
}: {
  onResolved: (place: ResolvedPlace) => void;
  label?: string;
}) {
  const key = placesKey();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [open, setOpen] = useState(false);
  // Suppress the next debounced fetch right after a selection fills the input.
  const skipNext = useRef(false);

  useEffect(() => {
    if (!key) return;
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
        const next = await fetchSuggestions(q, key);
        if (!cancelled) {
          setSuggestions(next);
          setOpen(next.length > 0);
        }
      } catch {
        // Network / quota / CORS — fail quiet, manual entry still works.
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, key]);

  if (!key) {
    return (
      <View className="rounded-xl bg-surface-alt px-3 py-2">
        <Text variant="caption" className="text-ink-soft">
          Address autofill is off (no Google Places key configured). Enter city and country below.
        </Text>
      </View>
    );
  }

  const pick = async (s: Suggestion) => {
    setOpen(false);
    skipNext.current = true;
    setQuery(s.secondary ? `${s.primary}, ${s.secondary}` : s.primary);
    setResolving(true);
    try {
      const place = await fetchDetails(s.placeId, key);
      onResolved(place);
    } catch {
      // Leave manual fields as-is on failure.
    } finally {
      setResolving(false);
    }
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
      {resolving ? <Skeleton className="h-4 w-32" /> : null}
      {open ? (
        <View className="rounded-xl border border-surface-border bg-surface overflow-hidden">
          {suggestions.map((s, i) => (
            <Pressable
              key={s.placeId}
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
          ) : null}
        </View>
      ) : null}
    </VStack>
  );
}
