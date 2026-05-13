import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  tryGetSupabase,
  useCancelBooking,
  useGuestDashboard,
  type GuestBooking,
} from '@bnb/api';
import {
  ArrowLeft,
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  IconButton,
  Image,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';

export type TripDetailScreenProps = { id: string };

const SERVICE_FEE_RATE = 0.11; // shown in price breakdown; mirrors the take-rate model

export function TripDetailScreen({ id }: TripDetailScreenProps) {
  const router = useRouter();
  const { data, isLoading } = useGuestDashboard();
  const cancelBooking = useCancelBooking();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const booking = data?.bookings.find((b) => b.id === id);
  const isPreview = data?.isPreview ?? false;

  if (isLoading || !data) return <LoadingState />;
  if (!booking) return <NotFound onBack={() => router.push('/trips')} />;

  const today = new Date().toISOString().slice(0, 10);
  const nightlyCents = Math.round(booking.total_cents / Math.max(1, booking.nights));
  const cleaningCents = Math.round(nightlyCents * 0.15);
  const serviceFeeCents = Math.round(booking.total_cents * SERVICE_FEE_RATE);
  const taxCents = Math.round(booking.total_cents * 0.05);
  const subtotalCents = booking.total_cents - cleaningCents - serviceFeeCents - taxCents;

  const cancel = async () => {
    if (isPreview || booking.id.startsWith('g-')) {
      toast.success(`Cancelled (demo) — ${booking.listing_title}.`, {
        description: "Real cancellations land when you're signed in with Supabase.",
      });
      router.replace('/trips');
      return;
    }
    if (!tryGetSupabase()) {
      toast.error("Couldn't cancel — auth backend isn't configured here.");
      return;
    }
    try {
      await cancelBooking.mutateAsync(booking.id);
      toast.success(`Cancelled your stay at ${booking.listing_title}.`);
      router.replace('/trips');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not cancel that booking.';
      toast.error("Couldn't cancel the booking.", { description: msg });
    }
  };

  const canCancel =
    booking.status === 'upcoming' || (booking.status === 'in_stay' && booking.end_date >= today);

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="md:mx-auto md:w-full md:max-w-[1000px] px-4 pt-4 pb-20 md:px-10 md:pt-6">
        {/* Back */}
        <HStack className="gap-2 items-center mb-4">
          <IconButton onPress={() => router.push('/trips')}>
            <ArrowLeft size={16} color="#222" />
          </IconButton>
          <Text variant="small" className="text-ink-soft">
            All trips
          </Text>
        </HStack>

        {/* Hero */}
        <Card className="overflow-hidden p-0">
          <View className="md:flex-row">
            <View className="h-64 w-full md:h-72 md:w-[50%] bg-surface-alt">
              {booking.listing_photo ? (
                <Image uri={booking.listing_photo} style={{ width: '100%', height: '100%' }} />
              ) : null}
            </View>
            <VStack className="flex-1 p-6 gap-2">
              <HStack className="gap-2 items-center">
                <Badge variant={statusVariant(booking.status)}>
                  {labelForStatus(booking.status)}
                </Badge>
                <Text variant="small" className="text-ink-soft">
                  {formatDateRange(booking.start_date, booking.end_date)} · {booking.nights}{' '}
                  {booking.nights === 1 ? 'night' : 'nights'}
                </Text>
              </HStack>
              <Heading level={2} numberOfLines={2}>
                {booking.listing_title}
              </Heading>
              <Text className="text-ink-soft">
                {booking.listing_city}, {booking.listing_country}
              </Text>
              <Pressable onPress={() => router.push(`/listing/${booking.listing_id}`)}>
                <Text variant="small" className="text-ink underline mt-2">
                  Open listing →
                </Text>
              </Pressable>
            </VStack>
          </View>
        </Card>

        {/* Two-column on desktop: stay info + price breakdown */}
        <View className="mt-6 flex-col md:flex-row gap-6">
          <View className="flex-1 md:max-w-[560px] gap-6">
            <Card className="p-5 gap-3">
              <Heading level={3}>Your stay</Heading>
              <Divider />
              <FieldRow label="Check-in" value={booking.start_date} />
              <FieldRow label="Check-out" value={booking.end_date} />
              <FieldRow
                label="Nights"
                value={`${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'}`}
              />
              <FieldRow label="Hosted by" value={booking.host_name} />
              <FieldRow
                label="Cancellation"
                value={canCancel ? 'Flexible · cancel anytime up to 24h before' : 'Past the window'}
              />
            </Card>

            <Card className="p-5 gap-3">
              <Heading level={3}>What to do at arrival</Heading>
              <Divider />
              <Text className="text-ink-soft">
                {booking.status === 'in_stay'
                  ? "You're checked in. Concierge is one tap away if anything comes up."
                  : booking.status === 'upcoming'
                    ? `Check-in instructions arrive 24 hours before ${booking.start_date}. Your host's exact address is shared then.`
                    : booking.status === 'completed'
                      ? 'Thanks for staying with Ryo. A review request was sent shortly after check-out.'
                      : 'This booking was cancelled. No action needed.'}
              </Text>
            </Card>
          </View>

          <View className="flex-1 md:max-w-[420px] gap-6">
            <Card className="p-5 gap-3">
              <Heading level={3}>Price breakdown</Heading>
              <Divider />
              <PriceRow
                label={`${formatPrice(nightlyCents, booking.currency)} × ${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'}`}
                value={formatPrice(subtotalCents + cleaningCents, booking.currency)}
              />
              <PriceRow
                label="Cleaning fee"
                value={formatPrice(cleaningCents, booking.currency)}
              />
              <PriceRow
                label="Ryo service fee"
                value={formatPrice(serviceFeeCents, booking.currency)}
              />
              <PriceRow label="Taxes" value={formatPrice(taxCents, booking.currency)} />
              <Divider />
              <HStack className="justify-between">
                <Text className="font-semibold">Total ({booking.currency})</Text>
                <Text className="font-semibold">
                  {formatPrice(booking.total_cents, booking.currency)}
                </Text>
              </HStack>
              <Text variant="caption" className="mt-1">
                Mock payment · no card was charged
              </Text>
            </Card>

            {canCancel ? (
              <Card className="p-5 gap-3">
                <Heading level={4}>Need to cancel?</Heading>
                <Text variant="small" className="text-ink-soft">
                  You're inside the flexible-cancellation window. Refund amount depends on the
                  listing's cancellation policy.
                </Text>
                {!confirmCancel ? (
                  <Button
                    title="Cancel this booking"
                    variant="outline"
                    onPress={() => setConfirmCancel(true)}
                  />
                ) : (
                  <VStack className="gap-2">
                    <Text className="font-semibold">Are you sure?</Text>
                    <HStack className="gap-2">
                      <Button
                        title="Keep the booking"
                        variant="ghost"
                        onPress={() => setConfirmCancel(false)}
                      />
                      <Button
                        title={cancelBooking.isPending ? 'Cancelling…' : 'Yes, cancel'}
                        variant="outline"
                        loading={cancelBooking.isPending}
                        onPress={cancel}
                      />
                    </HStack>
                  </VStack>
                )}
              </Card>
            ) : null}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between items-start">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text className="font-semibold text-right flex-shrink ml-4" numberOfLines={2}>
        {value}
      </Text>
    </HStack>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between">
      <Text variant="small" className="text-ink-soft flex-1 mr-2" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="small" className="font-semibold">
        {value}
      </Text>
    </HStack>
  );
}

function statusVariant(s: GuestBooking['status']): 'brand' | 'dark' | 'neutral' {
  if (s === 'in_stay') return 'brand';
  if (s === 'upcoming') return 'dark';
  return 'neutral';
}

function labelForStatus(s: GuestBooking['status']): string {
  return s === 'in_stay' ? 'In stay' : s.charAt(0).toUpperCase() + s.slice(1);
}

function LoadingState() {
  return (
    <View className="flex-1 bg-surface p-4 md:p-10 md:mx-auto md:max-w-[1000px] w-full gap-4">
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </View>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-surface items-center justify-center p-10 gap-3">
      <Heading level={2}>Trip not found</Heading>
      <Text className="text-ink-soft max-w-[420px] text-center">
        We couldn't find that booking. It may have been cancelled or removed.
      </Text>
      <Button title="Back to all trips" onPress={onBack} />
    </View>
  );
}
