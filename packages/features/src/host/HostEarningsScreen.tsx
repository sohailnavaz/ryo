import { useState } from 'react';
import { View } from 'react-native';
import {
  DEMO_HOST_ID,
  useHostEarnings,
  type HostEarningsPeriod,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { formatPrice } from '@bnb/utils';
import { HostShell } from './shell';

const PERIODS: Array<{ key: HostEarningsPeriod; label: string }> = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'ytd',        label: 'Year to date' },
];

export function HostEarningsScreen({ hostId = DEMO_HOST_ID }: { hostId?: string }) {
  const [period, setPeriod] = useState<HostEarningsPeriod>('this_month');
  const { data, isLoading } = useHostEarnings(hostId, period);

  return (
    <HostShell
      title="Earnings"
      subtitle="Gross, fees, net. Downloadable statements once payouts are wired."
    >
      <View className="mt-6 flex-row gap-2 flex-wrap">
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              className={`rounded-full border px-4 py-2 ${
                active ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
              }`}
            >
              <Text variant="small" className={active ? 'text-white font-semibold' : 'text-ink'}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading || !data ? (
        <Skeleton className="mt-6 h-[420px] w-full" />
      ) : (
        <>
          <View className="mt-6 flex-row flex-wrap gap-4">
            <SummaryCard label="Gross"      value={formatPrice(data.gross_cents, data.currency)} hint={`${data.bookings} bookings`} />
            <SummaryCard label="Platform fees" value={`- ${formatPrice(data.fees_cents, data.currency)}`} hint="3% guest + 12% host" />
            <SummaryCard label="Net to you" value={formatPrice(data.net_cents, data.currency)} hint={`${data.nights} nights`} bold />
          </View>

          <View className="mt-10 flex-col md:flex-row gap-6">
            <View className="flex-1">
              <Card className="p-5">
                <HStack className="justify-between">
                  <Text className="font-semibold">Payout queue</Text>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => toast.info('Preview only — would download CSV.')}
                  >
                    Download CSV
                  </Button>
                </HStack>
                <VStack className="mt-3 gap-3">
                  {data.payouts.length === 0 ? (
                    <Text className="text-ink-soft">No payouts in this period.</Text>
                  ) : (
                    data.payouts.map((p, i) => (
                      <View key={p.id}>
                        <HStack className="justify-between">
                          <VStack className="flex-1 gap-0.5">
                            <Text className="font-semibold">
                              {formatPrice(p.amount_cents, data.currency)}
                            </Text>
                            <Text variant="small" className="text-ink-soft">
                              {p.booking_count}{' '}
                              {p.booking_count === 1 ? 'booking' : 'bookings'} · {p.paid_at}
                            </Text>
                          </VStack>
                          <Badge
                            variant={
                              p.status === 'paid'
                                ? 'neutral'
                                : p.status === 'failed'
                                  ? 'brand'
                                  : 'dark'
                            }
                          >
                            {p.status}
                          </Badge>
                        </HStack>
                        {i < data.payouts.length - 1 ? <Divider className="mt-3" /> : null}
                      </View>
                    ))
                  )}
                </VStack>
              </Card>
            </View>

            <View className="md:w-[360px]">
              <Card className="p-5">
                <Text className="font-semibold">Tax</Text>
                <View className="mt-3 gap-2">
                  <Row label="Tax docs ready"  value="Year-end · December" />
                  <Row label="W-9 on file"     value="Yes" />
                  <Row label="VAT collected"   value="—" />
                </View>
                <Button
                  variant="outline"
                  className="mt-4"
                  onPress={() => toast.info('Preview only — opens tax document download.')}
                >
                  View tax documents
                </Button>
              </Card>
            </View>
          </View>

          <View className="mt-10">
            <Heading level={2}>By listing</Heading>
            <Card className="mt-3 p-0 overflow-hidden">
              <View className="hidden md:flex md:flex-row md:bg-surface-alt md:px-5 md:py-3 md:border-b md:border-surface-border">
                <Text variant="label" className="flex-[2]">Listing</Text>
                <Text variant="label" className="flex-1 text-right">Bookings</Text>
                <Text variant="label" className="flex-1 text-right">Nights</Text>
                <Text variant="label" className="flex-1 text-right">Gross</Text>
                <Text variant="label" className="flex-1 text-right">Net</Text>
              </View>
              {data.by_listing.map((l, i) => (
                <View
                  key={l.listing_id}
                  className={`px-4 py-3 md:px-5 md:flex-row md:items-center ${i < data.by_listing.length - 1 ? 'border-b border-surface-border' : ''}`}
                >
                  <Text className="flex-[2] font-semibold" numberOfLines={1}>
                    {l.listing_title}
                  </Text>
                  <Text variant="small" className="md:flex-1 md:text-right text-ink-soft">
                    {l.bookings} bookings · {l.nights} nights
                  </Text>
                  <Text variant="small" className="hidden md:flex md:flex-1 md:text-right">
                    {l.nights}
                  </Text>
                  <Text className="hidden md:flex md:flex-1 md:text-right">
                    {formatPrice(l.gross_cents, data.currency)}
                  </Text>
                  <Text className="md:flex-1 md:text-right font-semibold">
                    {formatPrice(l.net_cents, data.currency)}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        </>
      )}
    </HostShell>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  bold,
}: {
  label: string;
  value: string;
  hint: string;
  bold?: boolean;
}) {
  return (
    <Card className={`flex-1 min-w-[220px] p-5 ${bold ? 'border-2 border-ink' : ''}`}>
      <Text variant="small" className="text-ink-soft">{label}</Text>
      <Heading level={2} className="mt-2">{value}</Heading>
      <Text variant="small" className="text-ink-soft mt-1">{hint}</Text>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between py-1">
      <Text variant="small" className="text-ink-soft">{label}</Text>
      <Text>{value}</Text>
    </HStack>
  );
}
