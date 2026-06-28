import { useMemo, useState } from 'react';
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
  Input,
  Pressable,
  Search,
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

// ---------------------------------------------------------------------------
// Status taxonomy. Reservation status is the spine; payment + payout are
// derived signals so an ops person can scan settlement state at a glance.
// (Payments are still demo, so these are deterministic from booking status —
//  the detail screen carries the real captured/refunded trail.)
// ---------------------------------------------------------------------------

function reservationVariant(s: SyntheticBooking['status']): 'brand' | 'dark' | 'neutral' {
  if (s === 'in_stay') return 'brand';
  if (s === 'upcoming') return 'dark';
  return 'neutral';
}

function reservationLabel(s: SyntheticBooking['status']): string {
  return s.replace('_', ' ');
}

type Settlement = { label: string; variant: 'brand' | 'dark' | 'neutral' };

function paymentStatus(b: SyntheticBooking): Settlement {
  if (b.status === 'cancelled') return { label: 'Refunded', variant: 'neutral' };
  if (b.status === 'upcoming') return { label: 'Authorised', variant: 'dark' };
  return { label: 'Captured', variant: 'neutral' };
}

function payoutStatus(b: SyntheticBooking): Settlement {
  if (b.status === 'cancelled') return { label: 'Cancelled', variant: 'neutral' };
  if (b.status === 'completed') return { label: 'Paid out', variant: 'neutral' };
  if (b.status === 'in_stay') return { label: 'Pending', variant: 'dark' };
  return { label: 'Scheduled', variant: 'dark' };
}

export function AdminBookingsScreen() {
  const [filter, setFilter] = useState<AdminBookingsFilter>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useAdminBookings(filter);
  const router = useRouter();

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.guest_name.toLowerCase().includes(q) ||
        b.listing_title.toLowerCase().includes(q) ||
        b.listing_city.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <AdminShell
      title="Reservations"
      subtitle="Every reservation across every host. Search, filter, and open a record for the full payment trail and dispute actions."
    >
      <View className="mt-6 max-w-[420px]">
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search guest, listing, city, or booking id"
          leftIcon={<Search size={18} color="#6b7280" />}
          autoCapitalize="none"
        />
      </View>

      <View className="mt-4 flex-row gap-2 flex-wrap">
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
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : isError ? (
          <Card className="p-8 items-center">
            <Text className="font-semibold">Couldn’t load reservations.</Text>
            <Text variant="small" className="text-ink-soft mt-1">
              Something went wrong fetching the booking ledger.
            </Text>
            <Pressable className="mt-4" onPress={() => refetch()}>
              <Text className="text-brand-600 font-semibold underline">Retry</Text>
            </Pressable>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="p-10 items-center">
            <Text className="font-semibold">
              {search ? 'No reservations match your search.' : 'No reservations match this filter.'}
            </Text>
            {search ? (
              <Pressable className="mt-3" onPress={() => setSearch('')}>
                <Text className="text-brand-600 underline">Clear search</Text>
              </Pressable>
            ) : null}
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <TableHeader />
            {rows.map((b, i) => (
              <BookingRow
                key={b.id}
                b={b}
                last={i === rows.length - 1}
                onPress={() => router.push(`/admin/bookings/${b.id}`)}
              />
            ))}
          </Card>
        )}
      </View>
    </AdminShell>
  );
}

function TableHeader() {
  return (
    <View className="hidden lg:flex lg:flex-row lg:items-center px-5 py-3 bg-surface-alt border-b border-surface-border">
      <Text variant="label" className="flex-[3]">Reservation</Text>
      <Text variant="label" className="flex-[2]">Dates</Text>
      <Text variant="label" className="flex-1">Status</Text>
      <Text variant="label" className="flex-1">Payment</Text>
      <Text variant="label" className="flex-1">Payout</Text>
      <Text variant="label" className="flex-1 text-right">Total</Text>
    </View>
  );
}

function BookingRow({
  b,
  last,
  onPress,
}: {
  b: SyntheticBooking;
  last: boolean;
  onPress: () => void;
}) {
  const pay = paymentStatus(b);
  const payout = payoutStatus(b);
  return (
    <Pressable onPress={onPress}>
      <View
        className={`px-4 py-3 lg:px-5 lg:flex-row lg:items-center ${
          last ? '' : 'border-b border-surface-border'
        }`}
      >
        {/* Reservation (guest + listing) */}
        <HStack className="flex-[3] gap-3 items-center">
          <Avatar src={b.guest_avatar} name={b.guest_name} size={36} />
          <VStack className="flex-1 gap-0.5">
            <Text className="font-semibold" numberOfLines={1}>
              {b.listing_title}
            </Text>
            <Text variant="small" className="text-ink-soft" numberOfLines={1}>
              {b.guest_name} · {b.listing_city}
            </Text>
            <Text variant="caption" className="text-ink-soft">
              {b.id}
            </Text>
          </VStack>
        </HStack>

        {/* Compact (below lg): chips + dates + total on one wrap row */}
        <View className="lg:hidden mt-2">
          <HStack className="gap-2 flex-wrap items-center">
            <Badge variant={reservationVariant(b.status)}>{reservationLabel(b.status)}</Badge>
            <Badge variant={pay.variant}>{pay.label}</Badge>
            <Badge variant={payout.variant}>payout: {payout.label}</Badge>
          </HStack>
          <HStack className="mt-1 justify-between items-center">
            <Text variant="small" className="text-ink-soft">
              {formatDateRange(b.start_date, b.end_date)}
            </Text>
            <Text className="font-semibold">{formatPrice(b.total_cents, b.currency)}</Text>
          </HStack>
        </View>

        {/* Wide columns */}
        <Text variant="small" className="hidden lg:flex flex-[2] text-ink-soft">
          {formatDateRange(b.start_date, b.end_date)}
        </Text>
        <View className="hidden lg:flex flex-1">
          <Badge variant={reservationVariant(b.status)}>{reservationLabel(b.status)}</Badge>
        </View>
        <View className="hidden lg:flex flex-1">
          <Badge variant={pay.variant}>{pay.label}</Badge>
        </View>
        <View className="hidden lg:flex flex-1">
          <Badge variant={payout.variant}>{payout.label}</Badge>
        </View>
        <Text className="hidden lg:flex flex-1 font-semibold text-right justify-end">
          {formatPrice(b.total_cents, b.currency)}
        </Text>
      </View>
    </Pressable>
  );
}
