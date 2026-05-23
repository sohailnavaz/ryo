import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  DEMO_HOST_ID,
  dayKey,
  setDayBlocked,
  setDayPrice,
  useHostCalendar,
  useHostCalendarOverrides,
  type CalendarDay,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  HStack,
  Input,
  Pressable,
  Sheet,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { formatPrice } from '@bnb/utils';
import { SectionHeader } from '../shared/dashboard-chrome';
import { HostShell } from './shell';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** A synthetic day with any host overrides (block/unblock, price) applied on top. */
type EffectiveDay = CalendarDay & { hasPriceOverride: boolean; isManualBlock: boolean };

export function HostCalendarScreen({ hostId = DEMO_HOST_ID }: { hostId?: string }) {
  const { data, isLoading } = useHostCalendar(hostId, 60);
  const overrides = useHostCalendarOverrides();
  const [activeListing, setActiveListing] = useState<string | null>(null);
  const [editing, setEditing] = useState<EffectiveDay | null>(null);

  const activeId = activeListing ?? data?.listings[0]?.id ?? null;

  // Merge the override layer over the synthetic days so edits re-render instantly.
  const listingDays = useMemo<EffectiveDay[]>(() => {
    if (!data || !activeId) return [];
    return data.days
      .filter((d) => d.listing_id === activeId)
      .map((d) => {
        const key = dayKey(d.listing_id, d.date);
        const blockOverride = overrides.blocked[key];
        const priceOverride = overrides.priceCents[key];
        let state = d.state;
        // Booked days are immovable; only available/blocked respond to overrides.
        if (d.state !== 'booked' && blockOverride !== undefined) {
          state = blockOverride ? 'blocked' : 'available';
        }
        return {
          ...d,
          state,
          price_cents: priceOverride ?? d.price_cents,
          hasPriceOverride: priceOverride !== undefined,
          isManualBlock: d.state !== 'booked' && blockOverride === true,
        };
      });
  }, [data, activeId, overrides]);

  return (
    <HostShell
      title="Calendar"
      subtitle="Tap a day to block it, re-open it, or override the nightly price."
    >
      {isLoading || !data ? (
        <Skeleton className="mt-6 h-[420px] w-full" />
      ) : (
        <>
          <View className="mt-6 flex-row flex-wrap gap-2">
            {data.listings.map((l) => {
              const isActive = activeId === l.id;
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
            subtitle="Green = available · Brand = booked · Grey = blocked · Dot = custom price"
          />
          <Legend />
          <MonthGrid days={listingDays} onPick={(d) => setEditing(d)} />

          <SectionHeader title="iCal feeds" subtitle="Sync from external platforms" />
          <ICalCard />
        </>
      )}

      <DayEditorSheet day={editing} onClose={() => setEditing(null)} />
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

function MonthGrid({
  days,
  onPick,
}: {
  days: EffectiveDay[];
  onPick: (d: EffectiveDay) => void;
}) {
  // Bucket by yyyy-mm
  const months = useMemo(() => {
    const byMonth = new Map<string, EffectiveDay[]>();
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
        <Month key={m.key} monthKey={m.key} days={m.days} onPick={onPick} />
      ))}
    </VStack>
  );
}

function Month({
  monthKey,
  days,
  onPick,
}: {
  monthKey: string;
  days: EffectiveDay[];
  onPick: (d: EffectiveDay) => void;
}) {
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
  const total = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getDate();

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
          return <DayCell key={day} day={day} cell={cell} onPick={onPick} />;
        })}
      </View>
    </Card>
  );
}

function DayCell({
  day,
  cell,
  onPick,
}: {
  day: number;
  cell?: EffectiveDay;
  onPick: (d: EffectiveDay) => void;
}) {
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

  // Booked days aren't editable (a guest is staying); everything else is.
  const editable = !!cell && cell.state !== 'booked';

  const inner = (
    <View className={`flex-1 rounded-md items-center justify-center ${bg}`}>
      <Text variant="small" className={`font-semibold ${txt}`}>
        {day}
      </Text>
      {cell && cell.state === 'available' ? (
        <Text variant="caption" className="text-ink-soft">
          {formatPrice(cell.price_cents, 'USD').replace(/\.00$/, '')}
        </Text>
      ) : null}
      {cell?.hasPriceOverride ? (
        <View className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-ink" />
      ) : null}
    </View>
  );

  return (
    <View className="w-[14.285%] aspect-square p-0.5">
      {editable ? (
        <Pressable className="flex-1" onPress={() => onPick(cell!)}>
          {inner}
        </Pressable>
      ) : (
        inner
      )}
    </View>
  );
}

function DayEditorSheet({ day, onClose }: { day: EffectiveDay | null; onClose: () => void }) {
  const [price, setPrice] = useState('');

  // Seed the price field whenever a new day opens.
  const open = !!day;
  const seededFor = day ? dayKey(day.listing_id, day.date) : '';
  const [seedKey, setSeedKey] = useState('');
  if (open && seedKey !== seededFor) {
    setSeedKey(seededFor);
    setPrice(day ? String(Math.round(day.price_cents / 100)) : '');
  }

  if (!day) return null;

  const isBlocked = day.state === 'blocked';
  const prettyDate = new Date(day.date + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const applyPrice = () => {
    const dollars = Number(price);
    if (!Number.isFinite(dollars) || dollars <= 0) return;
    setDayPrice(day.listing_id, day.date, Math.round(dollars * 100));
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={prettyDate}>
      <VStack className="gap-5 px-1 pb-2">
        <HStack className="items-center justify-between">
          <Text className="text-ink-soft">Availability</Text>
          <Badge variant={isBlocked ? 'dark' : 'neutral'}>
            {isBlocked ? 'Blocked' : 'Available'}
          </Badge>
        </HStack>

        <Button
          variant={isBlocked ? 'primary' : 'secondary'}
          onPress={() => {
            setDayBlocked(day.listing_id, day.date, !isBlocked);
            onClose();
          }}
        >
          {isBlocked ? 'Re-open this day' : 'Block this day'}
        </Button>

        <View className="h-px bg-surface-border" />

        <VStack className="gap-2">
          <Text className="text-ink-soft">Nightly price (USD)</Text>
          <Input
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="e.g. 180"
          />
          {day.hasPriceOverride ? (
            <Text variant="caption" className="text-ink-soft">
              Custom price set for this day.
            </Text>
          ) : null}
          <HStack className="mt-1 gap-2">
            <Button variant="primary" className="flex-1" onPress={applyPrice}>
              Save price
            </Button>
            {day.hasPriceOverride ? (
              <Button
                variant="ghost"
                onPress={() => {
                  setDayPrice(day.listing_id, day.date, null);
                  onClose();
                }}
              >
                Reset
              </Button>
            ) : null}
          </HStack>
        </VStack>
      </VStack>
    </Sheet>
  );
}

function ICalCard() {
  const feeds = [
    { name: 'Airbnb', last: '2 minutes ago', status: 'synced' as const },
    { name: 'Booking.com', last: '6 minutes ago', status: 'synced' as const },
    { name: 'VRBO', last: '1 hour ago', status: 'conflict' as const },
    { name: 'Google', last: '17 hours ago', status: 'stale' as const },
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
            {i < feeds.length - 1 ? <View className="mt-3 h-px bg-surface-border" /> : null}
          </View>
        ))}
      </VStack>
    </Card>
  );
}
