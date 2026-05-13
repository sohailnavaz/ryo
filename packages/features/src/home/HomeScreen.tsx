import { useMemo, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { useFavoriteIds, useListings, useToggleFavorite } from '@bnb/api';
import type { Listing } from '@bnb/db';
import {
  CategoryBar,
  ListingCard,
  Pressable,
  SearchBar,
  Skeleton,
  Text,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { FilterSheet } from '../search/FilterSheet';
import { useFiltersStore } from '../state/filtersStore';

type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'top_rated' | 'newest';

const SORTS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'price_asc',   label: 'Price ↑' },
  { key: 'price_desc',  label: 'Price ↓' },
  { key: 'top_rated',   label: 'Top-rated' },
  { key: 'newest',      label: 'Newest' },
];

function sortListings(rows: Listing[], key: SortKey): Listing[] {
  if (key === 'recommended') return rows;
  const out = rows.slice();
  switch (key) {
    case 'price_asc':  return out.sort((a, b) => a.price_cents - b.price_cents);
    case 'price_desc': return out.sort((a, b) => b.price_cents - a.price_cents);
    case 'top_rated':  return out.sort((a, b) => b.rating_avg - a.rating_avg || b.rating_count - a.rating_count);
    case 'newest':     return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

// Cards are fixed-width inside the grid. They never stretch past CARD_MAX,
// no matter how many results match the current filters. A single result
// sits left-aligned at CARD_MAX rather than ballooning to fill the row.
const CARD_MAX = 320;
const CARD_GAP = 24;
const CARD_MIN = 220;

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const filters = useFiltersStore((s) => s.filters);
  const setFilters = useFiltersStore((s) => s.setFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, isLoading } = useListings(filters);
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const [sort, setSort] = useState<SortKey>('recommended');

  const sortedData = useMemo(() => sortListings(data ?? [], sort), [data, sort]);

  // Horizontal padding matches the SearchBar / CategoryBar wrappers below
  // (px-4 mobile / md:px-10 desktop). Kept in sync so cards line up.
  const PADDING_X = width >= 768 ? 40 : 16;
  const innerWidth = Math.max(0, width - 2 * PADDING_X);

  // Determine how many cards fit naturally in the inner width given the
  // CARD_MAX + CARD_GAP. Floor + clamp ≥ 1 so we never compute 0 columns.
  const naturalCols = Math.max(
    1,
    Math.floor((innerWidth + CARD_GAP) / (CARD_MAX + CARD_GAP)),
  );
  const columns = Math.min(naturalCols, 4);

  // Per-card width: slot width derived from column count, capped at
  // CARD_MAX (so cards don't grow on ultra-wide viewports) and floored at
  // CARD_MIN (so they stay readable on narrow ones).
  const rawSlot = (innerWidth - CARD_GAP * (columns - 1)) / Math.max(1, columns);
  const cardWidth = Math.max(CARD_MIN, Math.min(CARD_MAX, rawSlot));

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

      {/* Sort + result count */}
      <View
        className="flex-row flex-wrap items-center gap-2 px-4 pt-3 md:px-10"
        accessibilityRole="toolbar"
      >
        <Text variant="small" className="text-ink-soft mr-1">
          {isLoading
            ? 'Loading…'
            : `${sortedData.length} ${sortedData.length === 1 ? 'home' : 'homes'}`}
        </Text>
        <Text variant="small" className="text-ink-soft mr-1">
          ·
        </Text>
        {SORTS.map((s) => {
          const selected = s.key === sort;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              className={`rounded-full px-3 py-1.5 ${
                selected ? 'bg-ink' : 'border border-surface-border'
              }`}
            >
              <Text
                variant="small"
                className={`font-semibold ${selected ? 'text-white' : 'text-ink'}`}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View
          className="px-4 pt-4 pb-20 md:px-10 flex-row flex-wrap"
          style={{ gap: CARD_GAP }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ width: cardWidth }}>
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-3 w-1/2" />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          key={`cols-${columns}-${sort}`}
          data={sortedData}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? { gap: CARD_GAP, justifyContent: 'flex-start' } : undefined}
          contentContainerStyle={{
            paddingHorizontal: PADDING_X,
            paddingTop: 16,
            paddingBottom: 80,
            gap: CARD_GAP,
          }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-ink-soft">No listings match your filters.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
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
