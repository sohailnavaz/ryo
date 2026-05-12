import { useState } from 'react';
import { View } from 'react-native';
import {
  DEMO_HOST_ID,
  useHostBookings,
  type HostBookingsFilter,
  type SyntheticBooking,
} from '@bnb/api';
import {
  Avatar,
  Badge,
  Card,
  HStack,
  Pressable,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';
import { HostShell } from './shell';

const FILTERS: Array<{ key: HostBookingsFilter; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'in_stay',   label: 'In stay' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function HostBookingsScreen({ hostId = DEMO_HOST_ID }: { hostId?: string }) {
  const [filter, setFilter] = useState<HostBookingsFilter>('all');
  const { data, isLoading } = useHostBookings(hostId, filter);
  const router = useRouter();

  return (
    <HostShell
      title="Bookings"
      subtitle="Every reservation across every home. Filter, then click into one."
    >
      <View className="mt-6 flex-row flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = data?.totals?.[f.key] ?? 0;
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`rounded-full border px-4 py-2 ${
                active ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
              }`}
            >
              <Text
                variant="small"
                className={active ? 'text-white font-semibold' : 'text-ink'}
              >
                {f.label} {data ? `· ${count}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6">
        {isLoading || !data ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.bookings.length === 0 ? (
          <Card className="p-8 items-center">
            <Text className="text-ink-soft">No bookings match this filter.</Text>
          </Card>
        ) : (
          <BookingsList
            bookings={data.bookings}
            onPress={(id) => router.push(`/host/bookings/${id}`)}
          />
        )}
      </View>
    </HostShell>
  );
}

function BookingsList({
  bookings,
  onPress,
}: {
  bookings: SyntheticBooking[];
  onPress: (id: string) => void;
}) {
  return (
    <VStack className="gap-3">
      {bookings.map((b) => (
        <Pressable key={b.id} onPress={() => onPress(b.id)}>
          <Card className="p-4 md:flex-row md:items-center md:gap-5">
            <HStack className="gap-3 items-center md:flex-1">
              <Avatar src={b.guest_avatar} name={b.guest_name} size={40} />
              <VStack className="flex-1 gap-0.5">
                <Text className="font-semibold" numberOfLines={1}>
                  {b.guest_name}
                </Text>
                <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                  {b.listing_title} · {b.listing_city}
                </Text>
              </VStack>
            </HStack>
            <View className="mt-3 md:mt-0 md:flex-1">
              <Text variant="small" className="text-ink-soft">
                {formatDateRange(b.start_date, b.end_date)} · {b.nights}{' '}
                {b.nights === 1 ? 'night' : 'nights'}
              </Text>
            </View>
            <HStack className="mt-3 md:mt-0 gap-3 justify-between md:justify-end md:gap-4">
              <Badge variant={statusVariant(b.status)}>{statusLabel(b.status)}</Badge>
              <Text className="font-semibold">{formatPrice(b.total_cents, b.currency)}</Text>
            </HStack>
          </Card>
        </Pressable>
      ))}
    </VStack>
  );
}

function statusVariant(s: SyntheticBooking['status']): 'brand' | 'dark' | 'neutral' {
  if (s === 'in_stay') return 'brand';
  if (s === 'upcoming') return 'dark';
  return 'neutral';
}

function statusLabel(s: SyntheticBooking['status']): string {
  if (s === 'in_stay') return 'in stay';
  return s;
}
