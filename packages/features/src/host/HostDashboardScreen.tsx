import { View } from 'react-native';
import {
  DEMO_HOST_ID,
  useCanPublishListings,
  useHostDashboard,
  useMyHostApplication,
  type SyntheticBooking,
} from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Image,
  Pressable,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';
import { SectionHeader } from '../shared/dashboard-chrome';
import { HostShell } from './shell';

export function HostDashboardScreen({ hostId = DEMO_HOST_ID }: { hostId?: string }) {
  const router = useRouter();
  const { data, isLoading } = useHostDashboard(hostId);
  const canPublish = useCanPublishListings();
  const { application, status } = useMyHostApplication();

  const pendingRequests = (data?.bookings ?? []).filter(
    (b) => b.is_request && b.request_state === 'pending',
  );

  return (
    <HostShell title="Welcome back, Mira." subtitle="Here's how your homes are doing this week.">
      {!canPublish ? (
        <Card className="mb-4 p-5 border border-brand-500/40 bg-brand-500/5">
          <HStack className="items-center justify-between gap-3 flex-wrap">
            <VStack className="gap-0.5 flex-1 min-w-[220px]">
              <Text className="font-semibold">
                {application
                  ? status === 'changes_requested'
                    ? 'A few changes were requested on your application'
                    : status === 'rejected'
                      ? 'Your host application wasn’t approved'
                      : 'Your host application is in review'
                  : 'Become a host on Ryo'}
              </Text>
              <Text variant="small" className="text-ink-soft">
                {application
                  ? status === 'pending'
                    ? 'Our team is reviewing it — we’ll be in touch soon.'
                    : 'Open your application for details.'
                  : 'Apply once to publish your first listing — it takes about 3 minutes.'}
              </Text>
            </VStack>
            <Button
              title={
                application
                  ? status === 'changes_requested'
                    ? 'Update application'
                    : 'View application'
                  : 'Become a host'
              }
              onPress={() => router.push('/host/apply')}
            />
          </HStack>
        </Card>
      ) : null}

      {pendingRequests.length > 0 ? (
        <Pressable onPress={() => router.push('/host/bookings')}>
          <Card className="mb-4 p-4 border border-brand-500/40">
            <HStack className="items-center justify-between gap-2 flex-wrap">
              <VStack className="gap-0.5">
                <Text className="font-semibold">
                  {pendingRequests.length} booking {pendingRequests.length === 1 ? 'request' : 'requests'} awaiting you
                </Text>
                <Text variant="small" className="text-ink-soft">
                  Accept or decline to confirm the stay →
                </Text>
              </VStack>
              <Badge variant="brand">action needed</Badge>
            </HStack>
          </Card>
        </Pressable>
      ) : null}

      {isLoading || !data ? (
        <KpiSkeletons />
      ) : (
        <KpiRow stats={data.stats} currency={data.listings[0]?.currency ?? 'USD'} />
      )}

      <SectionHeader title="Upcoming & in-stay" subtitle="Next 30 days, sorted by check-in" />
      {isLoading || !data ? (
        <ListSkeleton rows={3} />
      ) : (
        <UpcomingList
          bookings={data.bookings.filter(
            (b) => b.status === 'upcoming' || b.status === 'in_stay',
          )}
          onPressBooking={(id) => router.push(`/host/bookings/${id}`)}
        />
      )}

      <SectionHeader title="Your homes" subtitle={`${data?.listings.length ?? 0} active listings`} />
      {isLoading || !data ? (
        <GridSkeleton />
      ) : (
        <ListingsGrid
          listings={data.listings}
          onPress={(id) => router.push(`/host/listings/${id}/edit`)}
        />
      )}

      <SectionHeader title="Recent reviews" subtitle="What guests are saying" />
      {isLoading || !data ? (
        <ListSkeleton rows={3} />
      ) : (
        <ReviewsList reviews={data.reviews.slice(0, 5)} />
      )}
    </HostShell>
  );
}

// ---------------------------------------------------------------------------

function KpiRow({
  stats,
  currency,
}: {
  stats: NonNullable<ReturnType<typeof useHostDashboard>['data']>['stats'];
  currency: string;
}) {
  return (
    <View className="mt-6 flex-row flex-wrap gap-4">
      <KpiCard label="Active homes" value={String(stats.active_listings)} hint="published" />
      <KpiCard
        label="Upcoming check-ins"
        value={String(stats.upcoming_bookings)}
        hint={`${stats.in_stay_bookings} currently in-stay`}
      />
      <KpiCard
        label="This month"
        value={formatPrice(stats.this_month_earnings_cents, currency)}
        hint={`${stats.this_month_bookings} bookings · 85% net`}
      />
      <KpiCard
        label="Rating"
        value={stats.rating_avg.toFixed(2)}
        hint={`${stats.rating_count} reviews`}
      />
      <KpiCard
        label="Occupancy (30d)"
        value={`${Math.round(stats.occupancy_rate * 100)}%`}
        hint="Across all homes"
      />
      <KpiCard
        label="Response rate"
        value={`${Math.round(stats.response_rate * 100)}%`}
        hint={`${Math.round(stats.acceptance_rate * 100)}% accept`}
      />
    </View>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="flex-1 min-w-[180px] p-5">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Heading level={2} className="mt-2">
        {value}
      </Heading>
      <Text variant="small" className="text-ink-soft mt-1">
        {hint}
      </Text>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function UpcomingList({
  bookings,
  onPressBooking,
}: {
  bookings: SyntheticBooking[];
  onPressBooking: (id: string) => void;
}) {
  if (bookings.length === 0) {
    return (
      <Card className="mt-3 p-6 items-center">
        <Text className="text-ink-soft">No upcoming bookings in the next 30 days.</Text>
      </Card>
    );
  }
  return (
    <VStack className="mt-3 gap-3">
      {bookings.slice(0, 6).map((b) => (
        <Pressable key={b.id} onPress={() => onPressBooking(b.id)}>
          <Card className="p-4 md:flex-row md:items-center md:gap-5">
            <View className="h-32 w-full overflow-hidden rounded-xl bg-surface-alt md:h-20 md:w-32 md:flex-shrink-0">
              {b.listing_photo ? (
                <Image uri={b.listing_photo} style={{ width: '100%', height: '100%' }} />
              ) : null}
            </View>
            <VStack className="mt-3 md:mt-0 md:flex-1 gap-1">
              <HStack className="justify-between gap-2">
                <Text className="font-semibold flex-1" numberOfLines={1}>
                  {b.listing_title}
                </Text>
                {b.is_request && b.request_state === 'pending' ? (
                  <Badge variant="brand">request</Badge>
                ) : (
                  <Badge variant={b.status === 'in_stay' ? 'brand' : 'dark'}>
                    {b.status === 'in_stay' ? 'in stay' : 'upcoming'}
                  </Badge>
                )}
              </HStack>
              <Text variant="small" className="text-ink-soft">
                {b.listing_city}, {b.listing_country} · {formatDateRange(b.start_date, b.end_date)} · {b.nights} {b.nights === 1 ? 'night' : 'nights'}
              </Text>
              <HStack className="mt-1 gap-2 items-center">
                <Avatar src={b.guest_avatar} name={b.guest_name} size={24} />
                <Text variant="small" className="text-ink-soft">
                  {b.guest_name}
                </Text>
                <Text variant="small" className="text-ink-soft">
                  ·
                </Text>
                <Text variant="small" className="font-semibold">
                  {formatPrice(b.total_cents, b.currency)}
                </Text>
              </HStack>
            </VStack>
          </Card>
        </Pressable>
      ))}
    </VStack>
  );
}

// ---------------------------------------------------------------------------

function ListingsGrid({
  listings,
  onPress,
}: {
  listings: NonNullable<ReturnType<typeof useHostDashboard>['data']>['listings'];
  onPress: (id: string) => void;
}) {
  return (
    <View className="mt-3 flex-row flex-wrap gap-4">
      {listings.map((l) => {
        const photo = (l.photos ?? []).slice().sort((a, b) => a.position - b.position)[0]?.url;
        return (
          <Pressable
            key={l.id}
            onPress={() => onPress(l.id)}
            className="flex-1 min-w-[280px] md:min-w-[300px] md:max-w-[360px]"
          >
            <Card className="overflow-hidden p-0">
              <View className="aspect-video w-full bg-surface-alt">
                {photo ? (
                  <Image uri={photo} style={{ width: '100%', height: '100%' }} />
                ) : null}
              </View>
              <VStack className="p-4 gap-1">
                <Text className="font-semibold" numberOfLines={1}>
                  {l.title}
                </Text>
                <Text variant="small" className="text-ink-soft">
                  {l.city}, {l.country}
                </Text>
                <HStack className="mt-2 justify-between">
                  <Text variant="small" className="text-ink-soft">
                    ★ {l.rating_avg.toFixed(2)} ({l.rating_count})
                  </Text>
                  <Text className="font-semibold">{formatPrice(l.price_cents, l.currency)}</Text>
                </HStack>
              </VStack>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------

function ReviewsList({
  reviews,
}: {
  reviews: NonNullable<ReturnType<typeof useHostDashboard>['data']>['reviews'];
}) {
  if (reviews.length === 0) {
    return (
      <Card className="mt-3 p-6 items-center">
        <Text className="text-ink-soft">No reviews yet.</Text>
      </Card>
    );
  }
  return (
    <VStack className="mt-3 gap-3">
      {reviews.map((r) => (
        <Card key={r.id} className="p-4">
          <HStack className="gap-3 items-center">
            <Avatar src={r.guest_avatar} name={r.guest_name} size={36} />
            <VStack className="flex-1">
              <HStack className="gap-2 items-center">
                <Text className="font-semibold">{r.guest_name}</Text>
                <Text variant="small" className="text-ink-soft">
                  · ★ {r.rating}/5
                </Text>
              </HStack>
              <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                {r.listing_title}
              </Text>
            </VStack>
          </HStack>
          <Divider className="my-3" />
          <Text className="text-ink-soft">{r.body}</Text>
        </Card>
      ))}
    </VStack>
  );
}

function KpiSkeletons() {
  return (
    <View className="mt-6 flex-row flex-wrap gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-28 flex-1 min-w-[180px]" />
      ))}
    </View>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <VStack className="mt-3 gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </VStack>
  );
}

function GridSkeleton() {
  return (
    <View className="mt-3 flex-row flex-wrap gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-64 flex-1 min-w-[280px]" />
      ))}
    </View>
  );
}
