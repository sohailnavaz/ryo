import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { DEMO_HOST_ID, useHostCalendar, type CalendarDay } from '@bnb/api';
import { Badge, Card, HStack, Pressable, Skeleton, Text, VStack } from '@bnb/ui';
import { formatPrice } from '@bnb/utils';
import { SectionHeader } from '../shared/dashboard-chrome';
import { HostShell } from './shell';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function HostCalendarScreen({ hostId = DEMO_HOST_ID }: { hostId?: string }) {
  const { data, isLoading } = useHostCalendar(hostId, 60);
  const [activeListing, setActiveListing] = useState<string | null>(null);

  const listingDays = useMemo(() => {
    if (!data) return [];
    const id = activeListing ?? data.listings[0]?.id;
    return data.days.filter((d) => d.listing_id === id);
  }, [data, activeListing]);

  return (
    <HostShell
      title="Calendar"
      subtitle="Block dates, see who's coming, override nightly price. (Read-only in v2 preview.)"
    >
      {isLoading || !data ? (
        <Skeleton className="mt-6 h-[420px] w-full" />
      ) : (
        <>
          <View className="mt-6 flex-row flex-wrap gap-2">
            {data.listings.map((l) => {
              const isActive = (activeListing ?? data.listings[0]?.id) === l.id;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => setActiveListing(l.id)}
                  className={`rounded-full border px-4 py-2 ${
                    isActive ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
                  }`}
                >
                  <Text
                    variant="small"
                    className={isActive ? 'text-white font-semibold' : 'text-ink'}
                  >
                    {l.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionHeader
            title="Next 60 days"
            subtitle="Green = available · Brand = booked · Grey = blocked"
          />
          <Legend />
          <MonthGrid days={listingDays} />

          <SectionHeader title="iCal feeds" subtitle="Sync from external platforms" />
          <ICalCard />
        </>
      )}
    </HostShell>
  );
}

function Legend() {
  return (
    <HStack className="mt-3 gap-4 flex-wrap">
      <LegendDot label="Available" className="bg-[#E5EEE8]" />
      <LegendDot label="Booked" className="bg-brand-500" />
      <LegendDot label="Blocked" className="bg-surface-alt" />
    </HStack>
  );
}

function LegendDot({ label, className }: { label: string; className: string }) {
  return (
    <HStack className="gap-2">
      <View className={`h-3 w-3 rounded-sm ${className}`} />
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
    </HStack>
  );
}

function MonthGrid({ days }: { days: CalendarDay[] }) {
  // Bucket by yyyy-mm
  const months = useMemo(() => {
    const byMonth = new Map<string, CalendarDay[]>();
    for (const d of days) {
      const key = d.date.slice(0, 7);
      const arr = byMonth.get(key) ?? [];
      arr.push(d);
      byMonth.set(key, arr);
    }
    return Array.from(byMonth.entries()).map(([key, ds]) => ({ key, days: ds }));
  }, [days]);

  return (
    <VStack className="mt-4 gap-6">
      {months.map((m) => (
        <Month key={m.key} monthKey={m.key} days={m.days} />
      ))}
    </VStack>
  );
}

function Month({ monthKey, days }: { monthKey: string; days: CalendarDay[] }) {
  const monthName = new Date(monthKey + '-01T00:00:00Z').toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  // Lay out the grid: figure out where day 1 falls.
  const first = new Date(monthKey + '-01T00:00:00Z');
  const dayOfWeek = (first.getUTCDay() + 6) % 7; // Mon = 0
  const blanks = Array.from({ length: dayOfWeek });
  const dayMap = new Map(days.map((d) => [Number(d.date.slice(-2)), d] as const));
  const total = new Date(
    first.getUTCFullYear(),
    first.getUTCMonth() + 1,
    0,
  ).getDate();

  return (
    <Card className="p-5">
      <Text className="font-semibold">{monthName}</Text>
      <View className="mt-4 flex-row">
        {WEEKDAYS.map((w) => (
          <View key={w} className="flex-1 items-center">
            <Text variant="caption" className="text-ink-soft uppercase">
              {w}
            </Text>
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row flex-wrap">
        {blanks.map((_, i) => (
          <View key={`b-${i}`} className="w-[14.285%] aspect-square p-0.5" />
        ))}
        {Array.from({ length: total }).map((_, i) => {
          const day = i + 1;
          const cell = dayMap.get(day);
          return <DayCell key={day} day={day} cell={cell} />;
        })}
      </View>
    </Card>
  );
}

function DayCell({ day, cell }: { day: number; cell?: CalendarDay }) {
  let bg = 'bg-[#E5EEE8]';
  let txt = 'text-ink';
  if (!cell) {
    bg = 'bg-surface-alt';
    txt = 'text-ink-soft';
  } else if (cell.state === 'booked') {
    bg = 'bg-brand-500';
    txt = 'text-white';
  } else if (cell.state === 'blocked') {
    bg = 'bg-surface-alt';
    txt = 'text-ink-soft';
  }
  return (
    <View className="w-[14.285%] aspect-square p-0.5">
      <View className={`flex-1 rounded-md items-center justify-center ${bg}`}>
        <Text variant="small" className={`font-semibold ${txt}`}>
          {day}
        </Text>
        {cell && cell.state === 'available' ? (
          <Text variant="caption" className="text-ink-soft">
            {formatPrice(cell.price_cents, 'USD').replace(/\.00$/, '')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ICalCard() {
  const feeds = [
    { name: 'Airbnb',       last: '2 minutes ago',  status: 'synced' as const },
    { name: 'Booking.com',  last: '6 minutes ago',  status: 'synced' as const },
    { name: 'VRBO',         last: '1 hour ago',     status: 'conflict' as const },
    { name: 'Google',       last: '17 hours ago',   status: 'stale' as const },
  ];
  return (
    <Card className="mt-3 p-5">
      <VStack className="gap-3">
        {feeds.map((f, i) => (
          <View key={f.name}>
            <HStack className="justify-between">
              <VStack className="gap-0.5">
                <Text className="font-semibold">{f.name}</Text>
                <Text variant="small" className="text-ink-soft">
                  Last sync · {f.last}
                </Text>
              </VStack>
              <Badge
                variant={
                  f.status === 'synced' ? 'neutral' : f.status === 'conflict' ? 'brand' : 'dark'
                }
              >
                {f.status}
              </Badge>
            </HStack>
            {i < feeds.length - 1 ? (
              <View className="mt-3 h-px bg-surface-border" />
            ) : null}
          </View>
        ))}
      </VStack>
    </Card>
  );
}
