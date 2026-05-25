import { useMemo, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { useFavoriteIds, useListings, useToggleFavorite } from '@bnb/api';
import type { Listing } from '@bnb/db';
import {
  CategoryBar,
  Heading,
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

// Layout sits in a centered column capped at CONTENT_MAX (matching the
// max-w-[1600px] mx-auto wrappers on every row), and cards FILL that column
// evenly — never left-clustered with empty space on wide monitors.
const CONTENT_MAX = 1600;
const CARD_GAP = 24;
const CARD_TARGET = 240; // ideal card width; lower = denser grid (more cards/row)

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

  // Inner gutter (matches px-4 / md:px-10 on the rows). The content column is
  // capped at CONTENT_MAX and centered; PADDING_X is the side space that
  // centers it, so the grid lines up exactly with the hero/search/sort rows.
  const GUTTER = width >= 768 ? 40 : 16;
  const columnInner = Math.min(width - 2 * GUTTER, CONTENT_MAX - 2 * GUTTER);
  const PADDING_X = Math.max(GUTTER, (width - columnInner) / 2);

  // Columns derived from the column width; cards then fill it exactly (no cap),
  // so a full or partial row is always edge-to-edge within the column.
  const columns = Math.max(
    1,
    Math.min(5, Math.floor((columnInner + CARD_GAP) / (CARD_TARGET + CARD_GAP))),
  );
  const cardWidth = (columnInner - CARD_GAP * (columns - 1)) / columns;

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
      {/* Editorial hero — omotenashi, one idea, generous space (branding §7.0) */}
      <View className="w-full max-w-[1600px] mx-auto px-4 pt-6 pb-1 md:px-10 md:pt-12 md:pb-3">
        <Heading level={1} className="max-w-[680px] md:text-[52px]">
          Stay anywhere — and feel hosted.
        </Heading>
        <Text className="mt-3 max-w-[560px] text-ink-soft md:text-[17px] md:leading-[26px]">
          Vetted homes, a 24/7 concierge, and honest all-in pricing.{' '}
          <Text className="text-brand-500 font-semibold">Just Ryo it.</Text>
        </Text>
      </View>
      <View className="w-full max-w-[1600px] mx-auto px-4 pt-3 md:px-10 md:pt-4 md:pb-2">
        <SearchBar
          label={filters.destination || 'Anywhere'}
          subLabel={subLabel}
          onPress={() => setFilterOpen(true)}
          onOpenFilters={() => setFilterOpen(true)}
        />
      </View>
      <View className="w-full max-w-[1600px] mx-auto">
        <CategoryBar
          value={filters.category ?? 'All'}
          onChange={(c) => setFilters({ category: c })}
        />
      </View>

      {/* Sort + result count */}
      <View
        className="w-full max-w-[1600px] mx-auto flex-row flex-wrap items-center gap-2 px-4 pt-3 md:px-10"
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
          className="w-full max-w-[1600px] mx-auto px-4 pt-4 pb-20 md:px-10 flex-row flex-wrap"
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
            <View className="py-20 items-center px-6">
              <Heading level={3} className="text-center">Nothing matches just yet</Heading>
              <Text className="mt-2 text-center text-ink-soft max-w-[360px]">
                Try widening your dates or clearing a filter — there’s a place out there prepared for you.
              </Text>
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
