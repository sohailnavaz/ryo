import { useState } from 'react';
import { View } from 'react-native';
import {
  useAdminBookings,
  type AdminBookingsFilter,
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
import { AdminShell } from './shell';

const FILTERS: Array<{ key: AdminBookingsFilter; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'in_stay',   label: 'In stay' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function AdminBookingsScreen() {
  const [filter, setFilter] = useState<AdminBookingsFilter>('all');
  const { data, isLoading } = useAdminBookings(filter);
  const router = useRouter();

  return (
    <AdminShell
      title="Bookings"
      subtitle="Every reservation across every host. Click a row for full inspector."
    >
      <View className="mt-6 flex-row gap-2 flex-wrap">
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
        ) : data.rows.length === 0 ? (
          <Card className="p-8 items-center">
            <Text className="text-ink-soft">No bookings match this filter.</Text>
          </Card>
        ) : (
          <VStack className="gap-2">
            {data.rows.map((b) => (
              <BookingRow
                key={b.id}
                b={b}
                onPress={() => router.push(`/admin/bookings/${b.id}`)}
              />
            ))}
          </VStack>
        )}
      </View>
    </AdminShell>
  );
}

function BookingRow({ b, onPress }: { b: SyntheticBooking; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card className="px-4 py-3">
        <HStack className="gap-3 items-center">
          <Avatar src={b.guest_avatar} name={b.guest_name} size={36} />
          <VStack className="flex-1 gap-0.5">
            <HStack className="gap-2 items-center">
              <Text className="font-semibold flex-1" numberOfLines={1}>{b.listing_title}</Text>
              <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
            </HStack>
            <Text variant="small" className="text-ink-soft" numberOfLines={1}>
              {b.guest_name} · {b.listing_city} · {formatDateRange(b.start_date, b.end_date)}
            </Text>
          </VStack>
          <Text className="font-semibold">{formatPrice(b.total_cents, b.currency)}</Text>
        </HStack>
      </Card>
    </Pressable>
  );
}

function statusVariant(s: SyntheticBooking['status']): 'brand' | 'dark' | 'neutral' {
  if (s === 'in_stay') return 'brand';
  if (s === 'upcoming') return 'dark';
  return 'neutral';
}
