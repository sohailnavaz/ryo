import { useState } from 'react';
import { FlatList, Image, View } from 'react-native';
import { useMyBookings } from '@bnb/api';
import { Badge, Card, Heading, HStack, Pressable, Skeleton, Text, VStack } from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';

export function TripsScreen() {
  const router = useRouter();
  const { data, isLoading } = useMyBookings();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const today = new Date().toISOString().slice(0, 10);

  const filtered = (data ?? []).filter((b) =>
    tab === 'upcoming' ? b.end_date >= today : b.end_date < today,
  );

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-6 md:px-10 md:mx-auto md:w-full md:max-w-[1120px]">
        <Heading level={1}>Trips</Heading>
        <HStack className="mt-4 gap-2">
          {(['upcoming', 'past'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`rounded-full border px-4 py-2 ${
                tab === t ? 'border-ink bg-surface-alt' : 'border-surface-border'
              }`}
            >
              <Text className="font-semibold capitalize">{t}</Text>
            </Pressable>
          ))}
        </HStack>
      </View>

      {isLoading ? (
        <View className="p-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Heading level={3}>No {tab} trips</Heading>
          <Text className="text-ink-soft mt-2">
            {tab === 'upcoming'
              ? 'Time to dust off your bags and start planning your next adventure.'
              : 'Your past trips will show up here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => {
            const cover = item.listing.photos?.sort((a, b) => a.position - b.position)[0]?.url;
            return (
              <Pressable onPress={() => router.push(`/listing/${item.listing.id}`)}>
                <Card className="p-4 md:flex-row md:gap-4 md:items-center">
                  <View className="h-40 w-full overflow-hidden rounded-xl bg-surface-alt md:h-24 md:w-40 md:flex-shrink-0">
                    {cover ? (
                      <Image
                        source={{ uri: cover }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                  <VStack className="mt-3 md:mt-0 md:flex-1 gap-1">
                    <HStack className="justify-between">
                      <Text className="font-semibold" numberOfLines={1}>
                        {item.listing.title}
                      </Text>
                      <Badge variant={item.status === 'confirmed' ? 'dark' : 'neutral'}>
                        {item.status}
                      </Badge>
                    </HStack>
                    <Text variant="small" className="text-ink-soft">
                      {item.listing.city}, {item.listing.country}
                    </Text>
                    <Text variant="small">{formatDateRange(item.start_date, item.end_date)}</Text>
                    <Text variant="small" className="font-semibold">
                      {formatPrice(item.total_cents, 'USD')}
                    </Text>
                  </VStack>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
