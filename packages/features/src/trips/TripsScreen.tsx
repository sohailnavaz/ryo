import { useState } from 'react';
import { View } from 'react-native';
import {
  tryGetSupabase,
  useCancelBooking,
  useGuestDashboard,
  type GuestBooking,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Heading,
  HStack,
  Image,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';

type Tab = 'upcoming' | 'past' | 'cancelled';

export function TripsScreen() {
  const router = useRouter();
  const { data, isLoading } = useGuestDashboard();
  const cancelBooking = useCancelBooking();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const isPreview = data?.isPreview ?? false;
  const today = new Date().toISOString().slice(0, 10);

  const all = data?.bookings ?? [];
  const filtered = all.filter((b) => {
    if (tab === 'upcoming') return (b.status === 'upcoming' || b.status === 'in_stay');
    if (tab === 'past') return b.status === 'completed';
    return b.status === 'cancelled';
  });

  const upcomingCount = all.filter((b) => b.status === 'upcoming' || b.status === 'in_stay').length;
  const pastCount = all.filter((b) => b.status === 'completed').length;
  const cancelledCount = all.filter((b) => b.status === 'cancelled').length;

  const cancel = async (booking: GuestBooking) => {
    // In preview mode, the booking id is a synthetic string (e.g. `g-up-l-positano-cliffside`).
    // No real Supabase row exists, so don't call the mutation — just acknowledge.
    if (isPreview || booking.id.startsWith('g-')) {
      toast.success(`Cancelled (demo) — ${booking.listing_title}.`, {
        description: "Real cancellations land when you're signed in with Supabase.",
      });
      setConfirmCancel(null);
      return;
    }
    if (!tryGetSupabase()) {
      toast.error("Couldn't cancel — auth backend isn't configured here.");
      return;
    }
    try {
      await cancelBooking.mutateAsync(booking.id);
      toast.success(`Cancelled your stay at ${booking.listing_title}.`);
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
          {(
            [
              { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
              { key: 'past', label: 'Past', count: pastCount },
              { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
            ] as const
          ).map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className={`rounded-full border px-4 py-2 ${
                tab === t.key ? 'border-ink bg-surface-alt' : 'border-surface-border'
              }`}
            >
              <Text className="font-semibold">
                {t.label}
                {t.count > 0 ? ` · ${t.count}` : ''}
              </Text>
            </Pressable>
          ))}
        </HStack>
      </View>

      {isLoading ? (
        <View className="p-4 md:px-10 md:mx-auto md:max-w-[1120px] w-full gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Heading level={3}>
            {tab === 'upcoming' ? 'No upcoming trips' : tab === 'past' ? 'No past trips' : 'No cancellations'}
          </Heading>
          <Text className="text-ink-soft mt-2 text-center max-w-[420px]">
            {tab === 'upcoming'
              ? 'Time to dust off your bags. Browse the explore feed and pick somewhere new.'
              : tab === 'past'
                ? 'Your past stays will show up here once you have completed bookings.'
                : 'Bookings you have cancelled appear here.'}
          </Text>
          {tab === 'upcoming' ? (
            <Button title="Explore stays" className="mt-4" onPress={() => router.push('/')} />
          ) : null}
        </View>
      ) : (
        <View className="md:mx-auto md:w-full md:max-w-[1120px] px-4 md:px-10 pt-4 pb-20 gap-3">
          {filtered.map((b) => {
            const isCancelled = b.status === 'cancelled';
            const isUpcomingNow = tab === 'upcoming' && !isCancelled;
            const showConfirm = confirmCancel === b.id;
            return (
              <View key={b.id}>
                <Pressable onPress={() => router.push(`/trips/${b.id}`)}>
                  <Card className="p-4 md:flex-row md:gap-4 md:items-center">
                    <View className="h-40 w-full overflow-hidden rounded-xl bg-surface-alt md:h-24 md:w-40 md:flex-shrink-0">
                      {b.listing_photo ? (
                        <Image uri={b.listing_photo} style={{ width: '100%', height: '100%' }} />
                      ) : null}
                    </View>
                    <VStack className="mt-3 md:mt-0 md:flex-1 gap-1">
                      <HStack className="justify-between gap-2">
                        <Text className="font-semibold flex-1" numberOfLines={1}>
                          {b.listing_title}
                        </Text>
                        <Badge variant={isCancelled ? 'neutral' : b.status === 'in_stay' ? 'brand' : 'dark'}>
                          {b.status === 'in_stay' ? 'in stay' : b.status}
                        </Badge>
                      </HStack>
                      <Text variant="small" className="text-ink-soft">
                        {b.listing_city}, {b.listing_country}
                      </Text>
                      <Text variant="small">
                        {formatDateRange(b.start_date, b.end_date)} · {b.nights}{' '}
                        {b.nights === 1 ? 'night' : 'nights'}
                      </Text>
                      <Text variant="small" className="font-semibold">
                        {formatPrice(b.total_cents, b.currency)}
                      </Text>
                    </VStack>
                  </Card>
                </Pressable>

                {/* Cancel control — only on upcoming, non-cancelled */}
                {isUpcomingNow ? (
                  <View className="mt-2">
                    {!showConfirm ? (
                      <Button
                        title="Cancel this booking"
                        variant="ghost"
                        onPress={() => setConfirmCancel(b.id)}
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
                            onPress={() => cancel(b)}
                          />
                        </HStack>
                      </Card>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
