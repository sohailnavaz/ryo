import { useState } from 'react';
import { FlatList, Image, View } from 'react-native';
import { useCancelBooking, useMyBookings } from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Heading,
  HStack,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';

export function TripsScreen() {
  const router = useRouter();
  const { data, isLoading } = useMyBookings();
  const cancelBooking = useCancelBooking();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = (data ?? []).filter((b) =>
    tab === 'upcoming' ? b.end_date >= today : b.end_date < today,
  );

  const cancel = async (id: string, title: string) => {
    try {
      await cancelBooking.mutateAsync(id);
      toast.success(`Cancelled your stay at ${title}.`);
      setConfirmCancel(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not cancel that booking.';
      toast.error("Couldn't cancel the booking.", { description: msg });
    }
  };

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
            const isCancelled = item.status === 'cancelled';
            const isUpcoming = tab === 'upcoming' && !isCancelled;
            const showConfirm = confirmCancel === item.id;
            return (
              <View>
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
                      <HStack className="justify-between gap-2">
                        <Text className="font-semibold flex-1" numberOfLines={1}>
                          {item.listing.title}
                        </Text>
                        <Badge variant={isCancelled ? 'neutral' : 'dark'}>{item.status}</Badge>
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

                {/* Cancel control — only on upcoming, non-cancelled trips. */}
                {isUpcoming ? (
                  <View className="mt-2">
                    {!showConfirm ? (
                      <Button
                        title="Cancel this booking"
                        variant="ghost"
                        onPress={() => setConfirmCancel(item.id)}
                      />
                    ) : (
                      <Card className="p-4 gap-3 border-[#B4432F]/30">
                        <Text className="font-semibold">Cancel this booking?</Text>
                        <Text variant="small" className="text-ink-soft">
                          Refund amount depends on the listing's cancellation policy. This action
                          can't be undone.
                        </Text>
                        <HStack className="gap-2">
                          <Button
                            title="Keep the booking"
                            variant="ghost"
                            onPress={() => setConfirmCancel(null)}
                          />
                          <Button
                            title={cancelBooking.isPending ? 'Cancelling…' : 'Yes, cancel'}
                            variant="outline"
                            loading={cancelBooking.isPending}
                            onPress={() => cancel(item.id, item.listing.title)}
                          />
                        </HStack>
                      </Card>
                    )}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
