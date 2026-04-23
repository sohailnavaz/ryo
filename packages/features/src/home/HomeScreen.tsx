import { useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { useFavoriteIds, useListings, useToggleFavorite } from '@bnb/api';
import {
  CategoryBar,
  ListingCard,
  SearchBar,
  Skeleton,
  Text,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { FilterSheet } from '../search/FilterSheet';
import { useFiltersStore } from '../state/filtersStore';

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const filters = useFiltersStore((s) => s.filters);
  const setFilters = useFiltersStore((s) => s.setFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, isLoading } = useListings(filters);
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();

  const columns = width >= 1280 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  const subLabel =
    [
      filters.destination,
      filters.startDate && filters.endDate
        ? `${filters.startDate} → ${filters.endDate}`
        : undefined,
      filters.guests ? `${filters.guests} guests` : undefined,
    ]
      .filter(Boolean)
      .join(' · ') || 'Any week · Add guests';

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-3 md:px-10 md:pt-4 md:pb-2">
        <SearchBar
          label={filters.destination || 'Anywhere'}
          subLabel={subLabel}
          onPress={() => setFilterOpen(true)}
          onOpenFilters={() => setFilterOpen(true)}
        />
      </View>
      <CategoryBar
        value={filters.category ?? 'All'}
        onChange={(c) => setFilters({ category: c })}
      />
      {isLoading ? (
        <View className="flex-row flex-wrap gap-4 p-4 md:px-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} className="flex-1 min-w-[45%] md:min-w-[30%] lg:min-w-[22%]">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-3 w-1/2" />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={data ?? []}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? { gap: 24 } : undefined}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 80,
            gap: 24,
          }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-ink-soft">No listings match your filters.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ListingCard
                listing={item}
                isFavorite={favIds.includes(item.id)}
                onToggleFavorite={() =>
                  toggleFav.mutate({ listingId: item.id, on: !favIds.includes(item.id) })
                }
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          )}
        />
      )}
      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} />
    </View>
  );
}
