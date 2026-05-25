import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View, useWindowDimensions } from 'react-native';
import { useFavoriteIds, useListings, useToggleFavorite } from '@bnb/api';
import type { Listing } from '@bnb/db';
import { Heading, Input, ListingCard, Pressable, Skeleton, Text } from '@bnb/ui';
import { Map, type MapMarker } from '@bnb/ui/Map';
import { useRouter } from '@bnb/ui/nav';

type CityCluster = {
  /** key === `${city}, ${country}` */
  key: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  listings: Listing[];
};

// Group listings into city clusters, averaging coordinates for the pin.
// NOTE: `Map` is imported from @bnb/ui/Map below, so we use a plain object
// (Record) rather than the global Map constructor for the accumulator.
function clusterByCity(rows: Listing[]): CityCluster[] {
  const acc: Record<string, CityCluster> = {};
  for (const l of rows) {
    const key = `${l.city}, ${l.country}`;
    const existing = acc[key];
    if (existing) {
      existing.count += 1;
      existing.lat += l.lat;
      existing.lng += l.lng;
      existing.listings.push(l);
    } else {
      acc[key] = {
        key,
        city: l.city,
        country: l.country,
        lat: l.lat,
        lng: l.lng,
        count: 1,
        listings: [l],
      };
    }
  }
  // Finalise averaged centroid, sort by supply (richest cities first).
  return Object.values(acc)
    .map((c) => ({ ...c, lat: c.lat / c.count, lng: c.lng / c.count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}

function blurbFor(c: CityCluster): string {
  const top = c.listings[0];
  const homes = `${c.count} ${c.count === 1 ? 'home' : 'homes'}`;
  const type = top?.property_type ? top.property_type.toLowerCase() : 'stays';
  return `${homes} in ${c.city}, ${c.country} — from cosy ${type} to standout escapes, each one prepared to host you.`;
}

export function DiscoverScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWide = width >= 1024;

  const { data, isLoading } = useListings({});
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();

  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const clusters = useMemo(() => clusterByCity(data ?? []), [data]);

  // Search-by-city over the known cities (no external geocoder).
  const matchingClusters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clusters;
    return clusters.filter(
      (c) =>
        c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    );
  }, [clusters, query]);

  const markers: MapMarker[] = useMemo(
    () =>
      matchingClusters.map((c) => ({
        id: c.key,
        lat: c.lat,
        lng: c.lng,
        label: c.city,
        count: c.count,
      })),
    [matchingClusters],
  );

  const selected = useMemo(
    () => clusters.find((c) => c.key === selectedKey) ?? null,
    [clusters, selectedKey],
  );

  // Listings shown in the results panel: the selected city, else all matches.
  const resultListings: Listing[] = useMemo(() => {
    if (selected) return selected.listings;
    return matchingClusters.flatMap((c) => c.listings);
  }, [selected, matchingClusters]);

  // Map center — fall back to a sensible global-ish point if no data.
  const center = matchingClusters[0] ?? { lat: 20, lng: 10 };

  const renderListItem = (item: Listing) => (
    <ListingCard
      listing={item}
      isFavorite={favIds.includes(item.id)}
      onToggleFavorite={() =>
        toggleFav.mutate({ listingId: item.id, on: !favIds.includes(item.id) })
      }
      onPress={() => router.push(`/listing/${item.id}`)}
    />
  );

  const Header = (
    <View>
      <Heading level={1} className="max-w-[680px] md:text-[44px]">
        Discover homes by place.
      </Heading>
      <Text className="mt-3 max-w-[560px] text-ink-soft md:text-[17px] md:leading-[26px]">
        Explore the map, pick a city, and find a home prepared just for you.{' '}
        <Text className="text-brand-500 font-semibold">Just Ryo it.</Text>
      </Text>

      <View className="mt-5 max-w-[420px]">
        <Input
          label="Search by city or country"
          placeholder="e.g. Goa, Kyoto, Portugal…"
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setSelectedKey(null);
          }}
          autoCapitalize="words"
          returnKeyType="search"
        />
      </View>

      {/* City chips over the known cities — no external geocoder. */}
      <View className="mt-4 flex-row flex-wrap gap-2">
        {matchingClusters.slice(0, 12).map((c) => {
          const active = c.key === selectedKey;
          return (
            <Pressable
              key={c.key}
              onPress={() => setSelectedKey(active ? null : c.key)}
              className={`flex-row items-center gap-2 rounded-full px-3 py-1.5 ${
                active ? 'bg-ink' : 'border border-surface-border'
              }`}
            >
              <Text
                variant="small"
                className={`font-semibold ${active ? 'text-white' : 'text-ink'}`}
              >
                {c.city}
              </Text>
              <Text variant="small" className={active ? 'text-white/70' : 'text-ink-soft'}>
                {c.count}
              </Text>
            </Pressable>
          );
        })}
        {selectedKey ? (
          <Pressable
            onPress={() => setSelectedKey(null)}
            className="rounded-full px-3 py-1.5 border border-surface-border"
          >
            <Text variant="small" className="font-semibold text-brand-600">
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* About-this-place blurb when a city is selected. */}
      {selected ? (
        <View className="mt-5 rounded-2xl border border-surface-border bg-surface-alt p-4">
          <Heading level={3}>
            {selected.city}, {selected.country}
          </Heading>
          <Text className="mt-1 text-ink-soft">{blurbFor(selected)}</Text>
        </View>
      ) : null}

      <View className="mt-5 flex-row items-center gap-2">
        <Text variant="small" className="text-ink-soft">
          {isLoading
            ? 'Loading…'
            : `${resultListings.length} ${resultListings.length === 1 ? 'home' : 'homes'}${
                selected ? ` in ${selected.city}` : query.trim() ? ' matching' : ' worldwide'
              }`}
        </Text>
      </View>
    </View>
  );

  const MapPanel = (
    <View className={isWide ? 'flex-1' : 'w-full'}>
      {isLoading ? (
        <View style={{ height: isWide ? 560 : 320 }}>
          <Skeleton className="h-full w-full rounded-2xl" />
        </View>
      ) : (
        <Map
          lat={selected?.lat ?? center.lat}
          lng={selected?.lng ?? center.lng}
          markers={markers}
          selectedId={selectedKey ?? undefined}
          onMarkerPress={(id) => setSelectedKey((cur) => (cur === id ? null : id))}
          style={{ height: isWide ? 560 : 320 }}
        />
      )}
    </View>
  );

  const ResultsPanel = (
    <View className={isWide ? 'flex-1' : 'w-full mt-6'}>
      {isLoading ? (
        <View className="flex-row flex-wrap" style={{ gap: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ width: isWide ? 260 : '100%' }}>
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-3 w-1/2" />
            </View>
          ))}
        </View>
      ) : resultListings.length === 0 ? (
        <View className="py-16 items-center px-6">
          <Heading level={3} className="text-center">
            No homes there yet
          </Heading>
          <Text className="mt-2 text-center text-ink-soft max-w-[360px]">
            Try another city, or clear the search to see everywhere Ryo hosts.
          </Text>
        </View>
      ) : (
        <FlatList
          key={`disc-${isWide ? 2 : 1}`}
          data={resultListings}
          keyExtractor={(item) => item.id}
          numColumns={isWide ? 2 : 1}
          scrollEnabled={false}
          columnWrapperStyle={isWide ? { gap: 24 } : undefined}
          contentContainerStyle={{ gap: 24 }}
          renderItem={({ item }) => (
            <View style={{ width: isWide ? '48%' : '100%' }}>{renderListItem(item)}</View>
          )}
        />
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 80 }}>
      <View className="w-full max-w-[1600px] mx-auto px-4 pt-6 md:px-10 md:pt-12">
        {Header}
        <View
          className={`mt-6 ${isWide ? 'flex-row items-start' : ''}`}
          style={isWide ? { gap: 32 } : undefined}
        >
          {MapPanel}
          {ResultsPanel}
        </View>
      </View>
    </ScrollView>
  );
}
