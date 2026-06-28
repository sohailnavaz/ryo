import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { popularPlaces, usePlacesSearch } from '@bnb/api';
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
import { useT } from '../i18n';

const PROPERTY_TYPES = ['House', 'Apartment', 'Cabin', 'Villa', 'Treehouse', 'Cottage'];

export type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function FilterSheet({ open, onClose }: FilterSheetProps) {
  const t = useT();
  const filters = useFiltersStore((s) => s.filters);
  const setFilters = useFiltersStore((s) => s.setFilters);
  const reset = useFiltersStore((s) => s.reset);

  const [destination, setDestination] = useState(filters.destination ?? '');
  const [destFocused, setDestFocused] = useState(false);
  const [guests, setGuests] = useState(String(filters.guests ?? ''));

  // Debounce the typed query (200ms) before hitting the place search, so we
  // don't fire a lookup on every keystroke.
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(destination.trim()), 200);
    return () => clearTimeout(timer);
  }, [destination]);

  // Worldwide destination search: live exhaustive results from Supabase when
  // wired, curated in-bundle fallback otherwise (handled inside usePlacesSearch).
  const { data: results } = usePlacesSearch(debounced, 8);
  const popular = useMemo(() => popularPlaces(6), []);

  // When the field is empty AND focused, show popular destinations; otherwise
  // show the (debounced) search results.
  const suggestions = useMemo(() => {
    if (!destFocused) return [];
    if (destination.trim().length === 0) return popular;
    return results ?? [];
  }, [destination, destFocused, results, popular]);
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
    <Sheet open={open} onClose={onClose} title={t('search.filters')}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 pb-4">
          <View className="gap-3">
            <Heading level={4}>{t('search.where')}</Heading>
            <Input
              placeholder={t('search.placeholder')}
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
            <Heading level={4}>{t('search.guests')}</Heading>
            <Input
              placeholder={t('search.guestsPlaceholder')}
              keyboardType="number-pad"
              value={guests}
              onChangeText={setGuests}
            />
          </View>
          <Divider className="my-0" />
          <View className="gap-3">
            <Heading level={4}>{t('search.pricePerNight')}</Heading>
            <View className="flex-row gap-3">
              <Input
                placeholder={t('search.min')}
                keyboardType="number-pad"
                value={minPrice}
                onChangeText={setMinPrice}
                containerClassName="flex-1"
              />
              <Input
                placeholder={t('search.max')}
                keyboardType="number-pad"
                value={maxPrice}
                onChangeText={setMaxPrice}
                containerClassName="flex-1"
              />
            </View>
          </View>
          <Divider className="my-0" />
          <View className="gap-3">
            <Heading level={4}>{t('search.propertyType')}</Heading>
            <View className="flex-row flex-wrap gap-2">
              {PROPERTY_TYPES.map((pt) => {
                const on = propertyTypes.includes(pt);
                return (
                  <Pressable key={pt} onPress={() => toggle(propertyTypes, pt, setPropertyTypes)}>
                    <View
                      className={`rounded-full border px-3 py-2 ${
                        on ? 'border-ink bg-surface-alt' : 'border-surface-border'
                      }`}
                    >
                      <Text variant="small">{pt}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Divider className="my-0" />
          <View className="gap-3">
            <Heading level={4}>{t('search.amenities')}</Heading>
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
          <Text className="underline font-semibold">{t('search.clearAll')}</Text>
        </Pressable>
        <Button title={t('search.showStays')} onPress={apply} size="md" />
      </View>
    </Sheet>
  );
}
