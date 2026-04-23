import { FlatList, View, useWindowDimensions } from 'react-native';
import { useFavoriteIds, useFavorites, useToggleFavorite } from '@bnb/api';
import { Heading, ListingCard, Skeleton, Text } from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

export function FavoritesScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { data = [], isLoading } = useFavorites();
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();

  const columns = width >= 1280 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-6 md:px-10">
        <Heading level={1}>Wishlists</Heading>
      </View>
      {isLoading ? (
        <View className="p-4 flex-row flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-60 flex-1 min-w-[40%]" />
          ))}
        </View>
      ) : data.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Heading level={3}>No saved stays yet</Heading>
          <Text className="text-ink-soft mt-2">Tap the heart on any listing to save it.</Text>
        </View>
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={data}
          keyExtractor={(l) => l.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? { gap: 24 } : undefined}
          contentContainerStyle={{ padding: 16, gap: 24 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ListingCard
                listing={item}
                isFavorite={favIds.includes(item.id)}
                onPress={() => router.push(`/listing/${item.id}`)}
                onToggleFavorite={() =>
                  toggleFav.mutate({ listingId: item.id, on: !favIds.includes(item.id) })
                }
              />
            </View>
          )}
        />
      )}
    </View>
  );
}
