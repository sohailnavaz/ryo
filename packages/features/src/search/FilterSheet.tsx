import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DUMMY_LISTINGS } from '@bnb/api';
import { AMENITIES } from '@bnb/db';
import {
  Badge,
  Button,
  Divider,
  Heading,
  Input,
  Pressable,
  Sheet,
  Text,
} from '@bnb/ui';
import { useFiltersStore } from '../state/filtersStore';

const PROPERTY_TYPES = ['House', 'Apartment', 'Cabin', 'Villa', 'Treehouse', 'Cottage'];

// Destinations are derived from the catalogue (dummy in dev / preview, real
// listings once Supabase is wired — same shape). Cities first, then unique
// countries; users get both granularities.
const DESTINATION_OPTIONS: ReadonlyArray<{ label: string; key: string }> = (() => {
  const seen = new Set<string>();
  const out: { label: string; key: string }[] = [];
  for (const l of DUMMY_LISTINGS) {
    const label = `${l.city}, ${l.country}`;
    if (!seen.has(label)) {
      seen.add(label);
      out.push({ label, key: l.city });
    }
  }
  for (const country of new Set(DUMMY_LISTINGS.map((l) => l.country))) {
    if (!seen.has(country)) {
      seen.add(country);
      out.push({ label: country, key: country });
    }
  }
  return out;
})();

export type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function FilterSheet({ open, onClose }: FilterSheetProps) {
  const filters = useFiltersStore((s) => s.filters);
  const setFilters = useFiltersStore((s) => s.setFilters);
  const reset = useFiltersStore((s) => s.reset);

  const [destination, setDestination] = useState(filters.destination ?? '');
  const [destFocused, setDestFocused] = useState(false);
  const [guests, setGuests] = useState(String(filters.guests ?? ''));

  // Autocomplete: show up to 8 suggestions matching the typed prefix.
  // When the field is empty AND focused, show a popular-destinations list
  // (the first 6 in the catalogue order).
  const suggestions = useMemo(() => {
    if (!destFocused) return [];
    const q = destination.trim().toLowerCase();
    if (q.length === 0) return DESTINATION_OPTIONS.slice(0, 6);
    return DESTINATION_OPTIONS
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [destination, destFocused]);
  const [minPrice, setMinPrice] = useState(String(filters.minPrice ?? ''));
  const [maxPrice, setMaxPrice] = useState(String(filters.maxPrice ?? ''));
  const [propertyTypes, setPropertyTypes] = useState<string[]>(filters.propertyTypes ?? []);
  const [amenities, setAmenities] = useState<string[]>(filters.amenities ?? []);

  const toggle = <T extends string>(list: T[], value: T, set: (v: T[]) => void) => {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const apply = () => {
    setFilters({
      destination: destination || undefined,
      guests: guests ? Number(guests) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      propertyTypes: propertyTypes.length ? propertyTypes : undefined,
      amenities: amenities.length ? amenities : undefined,
    });
    onClose();
  };

  const clear = () => {
    setDestination('');
    setGuests('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyTypes([]);
    setAmenities([]);
    reset();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Filters">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 pb-4">
          <View className="gap-3">
            <Heading level={4}>Where</Heading>
            <Input
              placeholder="e.g. Lisbon, Japan, Amalfi"
              value={destination}
              onChangeText={setDestination}
              onFocus={() => setDestFocused(true)}
              onBlur={() => {
                // Delay so taps on suggestions register before the list collapses
                setTimeout(() => setDestFocused(false), 150);
              }}
            />
            {suggestions.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Pressable
                    key={s.label}
                    onPress={() => {
                      setDestination(s.label);
                      setDestFocused(false);
                    }}
                  >
                    <View className="rounded-full border border-surface-border px-3 py-1.5 bg-surface">
                      <Text variant="small">{s.label}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <Divider className="my-0" />
          <View className="gap-3">
            <Heading level={4}>Guests</Heading>
            <Input
              placeholder="Number of guests"
              keyboardType="number-pad"
              value={guests}
              onChangeText={setGuests}
            />
          </View>
          <Divider className="my-0" />
          <View className="gap-3">
            <Heading level={4}>Price per night</Heading>
            <View className="flex-row gap-3">
              <Input
                placeholder="Min"
                keyboardType="number-pad"
                value={minPrice}
                onChangeText={setMinPrice}
                containerClassName="flex-1"
              />
              <Input
                placeholder="Max"
                keyboardType="number-pad"
                value={maxPrice}
                onChangeText={setMaxPrice}
                containerClassName="flex-1"
              />
            </View>
          </View>
          <Divider className="my-0" />
          <View className="gap-3">
            <Heading level={4}>Property type</Heading>
            <View className="flex-row flex-wrap gap-2">
              {PROPERTY_TYPES.map((t) => {
                const on = propertyTypes.includes(t);
                return (
                  <Pressable key={t} onPress={() => toggle(propertyTypes, t, setPropertyTypes)}>
                    <View
                      className={`rounded-full border px-3 py-2 ${
                        on ? 'border-ink bg-surface-alt' : 'border-surface-border'
                      }`}
                    >
                      <Text variant="small">{t}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Divider className="my-0" />
          <View className="gap-3">
            <Heading level={4}>Amenities</Heading>
            <View className="flex-row flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const on = amenities.includes(a);
                return (
                  <Pressable key={a} onPress={() => toggle(amenities, a, setAmenities)}>
                    {on ? (
                      <Badge variant="dark">{a}</Badge>
                    ) : (
                      <View className="rounded-full border border-surface-border px-3 py-1">
                        <Text variant="small">{a}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="flex-row items-center justify-between pt-2">
        <Pressable onPress={clear}>
          <Text className="underline font-semibold">Clear all</Text>
        </Pressable>
        <Button title="Show stays" onPress={apply} size="md" />
      </View>
    </Sheet>
  );
}
