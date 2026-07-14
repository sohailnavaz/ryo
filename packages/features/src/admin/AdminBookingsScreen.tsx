'use client';

import { useState } from 'react';
import { View } from 'react-native';
import { useAdminBookingList, type AdminBookingRow, type BookingDisplayStatus } from '@bnb/api';
import { Avatar, Badge, Card, DataTable, HStack, Input, Text, VStack, type Column } from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

// The bookings list, on real data + the Phase-1 table primitive.
//
// Note where the status comes from: the SERVER derives upcoming/in-stay/completed
// from the dates, because `bookings` only stores confirmed|cancelled. The old screen
// computed that in the browser, which meant every client had its own opinion of what
// "upcoming" meant depending on its clock and timezone.

const FILTERS: Array<{ key: BookingDisplayStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_stay', label: 'In stay' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function AdminBookingsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<BookingDisplayStatus | 'all'>('all');
  const [q, setQ] = useState('');

  const { data, isLoading } = useAdminBookingList(filter, q);
  const rows = data ?? [];

  const columns: Column<AdminBookingRow>[] = [
    {
      key: 'listing',
      header: 'Stay',
      flex: 2.2,
      render: (b) => (
        <VStack className="gap-0.5">
          <Text className="font-semibold" numberOfLines={1}>
            {b.listing_title}
          </Text>
          <Text variant="small" className="text-ink-soft" numberOfLines={1}>
            {b.city} · {b.start_date} → {b.end_date}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'guest',
      header: 'Guest',
      flex: 1.3,
      desktopOnly: true,
      render: (b) => (
        <HStack className="gap-2 items-center">
          <Avatar name={b.guest_name} size={26} />
          <Text variant="small" numberOfLines={1}>
            {b.guest_name}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'host',
      header: 'Host',
      flex: 1.1,
      desktopOnly: true,
      render: (b) => (
        <Text variant="small" className="text-ink-soft" numberOfLines={1}>
          {b.host_name}
        </Text>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      flex: 1,
      align: 'right',
      desktopOnly: true,
      render: (b) => <Text variant="small">{formatPrice(b.total_cents, b.currency)}</Text>,
    },
    {
      key: 'status',
      header: 'Status',
      flex: 1,
      align: 'right',
      render: (b) => (
        <Badge variant={b.display_status === 'cancelled' ? 'brand' : 'neutral'}>
          {b.display_status.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <AdminShell title="Bookings" subtitle="Every real booking on the platform.">
      <HStack className="mt-6 gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Card
            key={f.key}
            className={`px-3.5 py-2 rounded-full ${
              filter === f.key ? 'bg-ink border-ink' : 'bg-surface'
            }`}
          >
            <Text
              variant="small"
              className={filter === f.key ? 'text-surface font-semibold' : 'text-ink-soft'}
              onPress={() => setFilter(f.key)}
            >
              {f.label}
            </Text>
          </Card>
        ))}
      </HStack>

      <HStack className="mt-4 gap-3 items-center flex-wrap">
        <View className="flex-1 min-w-[220px]">
          <Input
            placeholder="Search by listing, guest, or booking id"
            value={q}
            onChangeText={setQ}
          />
        </View>
        <Text variant="small" className="text-ink-soft">
          {rows.length} {rows.length === 1 ? 'booking' : 'bookings'}
        </Text>
      </HStack>

      <View className="mt-4">
        <DataTable<AdminBookingRow>
          columns={columns}
          rows={rows}
          rowKey={(b) => b.id}
          onRowPress={(b) => router.push(`/admin/bookings/${b.id}`)}
          loading={isLoading}
          emptyTitle="No bookings"
          emptyMessage={
            q ? `Nothing matches “${q}”.` : 'No booking matches this filter.'
          }
        />
      </View>
    </AdminShell>
  );
}
