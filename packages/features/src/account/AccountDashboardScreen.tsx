import { ScrollView, View } from 'react-native';
import { useGuestDashboard, type GuestBooking } from '@bnb/api';
import type { Listing } from '@bnb/db';
import {
  Avatar,
  Badge,
  Card,
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
import { PreviewBanner, SectionHeader } from '../shared/dashboard-chrome';

export function AccountDashboardScreen() {
  const router = useRouter();
  const { data, isLoading } = useGuestDashboard();

  const greeting = greetingFor(new Date().getHours());
  const name = data?.user.display_name ?? 'there';

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="md:mx-auto md:w-full md:max-w-[1200px] px-4 pt-4 pb-20 md:px-10 md:pt-8">
        {data?.isPreview ? <PreviewBanner kind="guest" /> : null}

        <VStack className="mt-6 gap-1">
          <Text variant="small" className="text-ink-soft uppercase tracking-wider">
            Your account
          </Text>
          <Heading level={1}>
            {greeting}, {name}.
          </Heading>
          <Text className="text-ink-soft">
            {data?.bookings.some((b) => b.status === 'in_stay')
              ? 'You’re currently on a stay. Have a wonderful time.'
              : data?.bookings.some((b) => b.status === 'upcoming')
                ? 'You have travel coming up.'
                : 'Plan your next escape — Just Ryo it.'}
          </Text>
        </VStack>

        {isLoading || !data ? <KpiSkeletons /> : <KpiRow stats={data.stats} />}

        {/* Next-trip hero */}
        {!isLoading && data ? <NextTripHero bookings={data.bookings} onPress={(id) => router.push(`/listing/${id}`)} /> : null}

        {/* Two-column layout on desktop */}
        <View className="mt-10 flex-col md:flex-row gap-6">
          <View className="flex-1 md:max-w-[680px] gap-6">
            <View>
              <SectionHeader
                title="Upcoming trips"
                subtitle="Your next stays at a glance"
              />
              {isLoading || !data ? (
                <ListSkeleton rows={2} />
              ) : (
                <UpcomingTrips
                  bookings={data.bookings.filter((b) => b.status === 'upcoming' || b.status === 'in_stay')}
                  onPress={(id) => router.push(`/listing/${id}`)}
                  onMore={() => router.push('/trips')}
                />
              )}
            </View>

            <View>
              <SectionHeader
                title="Past stays"
                subtitle="Where you've been"
              />
              {isLoading || !data ? (
                <ListSkeleton rows={2} />
              ) : (
                <PastTrips
                  bookings={data.bookings.filter((b) => b.status === 'completed')}
                  onPress={(id) => router.push(`/listing/${id}`)}
                />
              )}
            </View>
          </View>

          <View className="flex-1 md:max-w-[480px] gap-6">
            <View>
              <SectionHeader title="Saved places" subtitle={`${data?.favourites.length ?? 0} favourites`} />
              {isLoading || !data ? (
                <GridSkeleton />
              ) : (
                <Favourites
                  favourites={data.favourites}
                  onPress={(id) => router.push(`/listing/${id}`)}
                  onMore={() => router.push('/wishlists')}
                />
              )}
            </View>

            <View>
              <SectionHeader title="Account" subtitle="Quick links" />
              <QuickLinks
                user={data?.user}
                onProfile={() => router.push('/profile')}
                onTrips={() => router.push('/trips')}
                onWishlists={() => router.push('/wishlists')}
                onExplore={() => router.push('/')}
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function greetingFor(hour: number): string {
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Up late';
}

function KpiRow({ stats }: { stats: NonNullable<ReturnType<typeof useGuestDashboard>['data']>['stats'] }) {
  return (
    <View className="mt-6 flex-row flex-wrap gap-4">
      <KpiCard label="Upcoming" value={String(stats.upcoming_trips)} hint={stats.in_stay > 0 ? `${stats.in_stay} in stay` : 'trips planned'} />
      <KpiCard label="Past stays" value={String(stats.past_trips)} hint="completed" />
      <KpiCard label="Favourites" value={String(stats.favourites)} hint="saved places" />
      <KpiCard label="Messages" value={String(stats.unread_messages)} hint="unread" />
    </View>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="flex-1 min-w-[160px] p-5">
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

function NextTripHero({
  bookings,
  onPress,
}: {
  bookings: GuestBooking[];
  onPress: (id: string) => void;
}) {
  const next = bookings.find((b) => b.status === 'in_stay') ?? bookings.find((b) => b.status === 'upcoming');
  if (!next) return null;

  const isInStay = next.status === 'in_stay';
  return (
    <Pressable onPress={() => onPress(next.listing_id)} className="mt-8">
      <Card className="overflow-hidden p-0">
        <View className="md:flex-row">
          <View className="h-56 w-full md:h-64 md:w-[44%] bg-surface-alt">
            {next.listing_photo ? (
              <Image uri={next.listing_photo} style={{ width: '100%', height: '100%' }} />
            ) : null}
          </View>
          <VStack className="flex-1 p-6 gap-2">
            <HStack className="gap-2 items-center">
              <Badge variant={isInStay ? 'brand' : 'dark'}>
                {isInStay ? 'In stay' : 'Up next'}
              </Badge>
              <Text variant="small" className="text-ink-soft">
                {formatDateRange(next.start_date, next.end_date)} · {next.nights}{' '}
                {next.nights === 1 ? 'night' : 'nights'}
              </Text>
            </HStack>
            <Heading level={2} numberOfLines={2}>
              {next.listing_title}
            </Heading>
            <Text className="text-ink-soft" numberOfLines={1}>
              {next.listing_city}, {next.listing_country} · hosted by {next.host_name}
            </Text>
            <HStack className="mt-3 gap-3 items-center">
              <Text className="font-semibold text-[18px]">
                {formatPrice(next.total_cents, next.currency)}
              </Text>
              <Text variant="small" className="text-ink-soft">total paid</Text>
            </HStack>
          </VStack>
        </View>
      </Card>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

function UpcomingTrips({
  bookings,
  onPress,
  onMore,
}: {
  bookings: GuestBooking[];
  onPress: (id: string) => void;
  onMore: () => void;
}) {
  if (bookings.length === 0) {
    return (
      <Card className="mt-3 p-6 items-center">
        <Text className="text-ink-soft">No upcoming stays. Time to plan one.</Text>
      </Card>
    );
  }
  return (
    <VStack className="mt-3 gap-3">
      {bookings.slice(0, 4).map((b) => (
        <Pressable key={b.id} onPress={() => onPress(b.listing_id)}>
          <Card className="p-4 flex-row items-center gap-4">
            <View className="h-20 w-20 overflow-hidden rounded-xl bg-surface-alt flex-shrink-0">
              {b.listing_photo ? (
                <Image uri={b.listing_photo} style={{ width: '100%', height: '100%' }} />
              ) : null}
            </View>
            <VStack className="flex-1 gap-0.5">
              <Text className="font-semibold" numberOfLines={1}>
                {b.listing_title}
              </Text>
              <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                {b.listing_city}, {b.listing_country}
              </Text>
              <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                {formatDateRange(b.start_date, b.end_date)} · {formatPrice(b.total_cents, b.currency)}
              </Text>
            </VStack>
            <Badge variant={b.status === 'in_stay' ? 'brand' : 'dark'}>
              {b.status === 'in_stay' ? 'in stay' : 'upcoming'}
            </Badge>
          </Card>
        </Pressable>
      ))}
      {bookings.length > 4 ? (
        <Pressable onPress={onMore}>
          <Card className="p-3 items-center">
            <Text className="font-semibold">See all trips →</Text>
          </Card>
        </Pressable>
      ) : null}
    </VStack>
  );
}

function PastTrips({
  bookings,
  onPress,
}: {
  bookings: GuestBooking[];
  onPress: (id: string) => void;
}) {
  if (bookings.length === 0) {
    return (
      <Card className="mt-3 p-6 items-center">
        <Text className="text-ink-soft">Your past stays will appear here.</Text>
      </Card>
    );
  }
  return (
    <VStack className="mt-3 gap-3">
      {bookings.slice(0, 3).map((b) => (
        <Pressable key={b.id} onPress={() => onPress(b.listing_id)}>
          <Card className="p-4 flex-row items-center gap-4">
            <View className="h-16 w-16 overflow-hidden rounded-xl bg-surface-alt flex-shrink-0">
              {b.listing_photo ? (
                <Image uri={b.listing_photo} style={{ width: '100%', height: '100%' }} />
              ) : null}
            </View>
            <VStack className="flex-1 gap-0.5">
              <Text className="font-semibold" numberOfLines={1}>
                {b.listing_title}
              </Text>
              <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                {b.listing_city} · {formatDateRange(b.start_date, b.end_date)}
              </Text>
            </VStack>
            <Badge variant="neutral">completed</Badge>
          </Card>
        </Pressable>
      ))}
    </VStack>
  );
}

// ---------------------------------------------------------------------------

function Favourites({
  favourites,
  onPress,
  onMore,
}: {
  favourites: Listing[];
  onPress: (id: string) => void;
  onMore: () => void;
}) {
  if (favourites.length === 0) {
    return (
      <Card className="mt-3 p-6 items-center">
        <Text className="text-ink-soft">No favourites yet. Tap the heart on a listing to save it.</Text>
      </Card>
    );
  }
  return (
    <View className="mt-3 gap-3">
      <View className="flex-row flex-wrap gap-3">
        {favourites.slice(0, 4).map((l) => {
          const photo = (l.photos ?? []).slice().sort((a, b) => a.position - b.position)[0]?.url;
          return (
            <Pressable key={l.id} onPress={() => onPress(l.id)} className="flex-1 min-w-[180px]">
              <Card className="overflow-hidden p-0">
                <View className="aspect-square w-full bg-surface-alt">
                  {photo ? (
                    <Image uri={photo} style={{ width: '100%', height: '100%' }} />
                  ) : null}
                </View>
                <VStack className="p-3 gap-0.5">
                  <Text className="font-semibold" numberOfLines={1}>
                    {l.title}
                  </Text>
                  <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                    {l.city}, {l.country}
                  </Text>
                </VStack>
              </Card>
            </Pressable>
          );
        })}
      </View>
      {favourites.length > 4 ? (
        <Pressable onPress={onMore}>
          <Card className="p-3 items-center">
            <Text className="font-semibold">See all favourites →</Text>
          </Card>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------

function QuickLinks({
  user,
  onProfile,
  onTrips,
  onWishlists,
  onExplore,
}: {
  user?: NonNullable<ReturnType<typeof useGuestDashboard>['data']>['user'];
  onProfile: () => void;
  onTrips: () => void;
  onWishlists: () => void;
  onExplore: () => void;
}) {
  return (
    <Card className="mt-3 p-4">
      <HStack className="gap-3 mb-4 items-center">
        <Avatar src={user?.avatar_url ?? null} name={user?.display_name ?? null} size={48} />
        <VStack className="flex-1">
          <Text className="font-semibold">{user?.display_name ?? 'Guest'}</Text>
          {user?.email ? (
            <Text variant="small" className="text-ink-soft" numberOfLines={1}>
              {user.email}
            </Text>
          ) : (
            <Text variant="small" className="text-ink-soft">
              Sign in to personalise.
            </Text>
          )}
        </VStack>
      </HStack>
      <VStack className="gap-2">
        <QuickLink label="Profile & preferences" onPress={onProfile} />
        <QuickLink label="My trips" onPress={onTrips} />
        <QuickLink label="Wishlists" onPress={onWishlists} />
        <QuickLink label="Explore stays" onPress={onExplore} />
      </VStack>
    </Card>
  );
}

function QuickLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-center justify-between rounded-xl bg-surface-alt px-4 py-3">
        <Text className="font-semibold">{label}</Text>
        <Text className="text-ink-soft">→</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

function KpiSkeletons() {
  return (
    <View className="mt-6 flex-row flex-wrap gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 flex-1 min-w-[160px]" />
      ))}
    </View>
  );
}

function ListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <VStack className="mt-3 gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </VStack>
  );
}

function GridSkeleton() {
  return (
    <View className="mt-3 flex-row flex-wrap gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-48 flex-1 min-w-[180px]" />
      ))}
    </View>
  );
}
