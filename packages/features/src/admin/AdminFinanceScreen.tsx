import { View } from 'react-native';
import { useAdminFinance } from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Heading,
  HStack,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

export function AdminFinanceScreen() {
  const { data, isLoading } = useAdminFinance();

  return (
    <AdminShell
      title="Finance"
      subtitle="Daily reconciliation, payout queue, chargebacks."
    >
      {isLoading || !data ? (
        <Skeleton className="mt-6 h-[600px] w-full" />
      ) : (
        <>
          <View className="mt-6">
            <Heading level={2}>GMV — last 14 days</Heading>
            <Card className="mt-3 p-5">
              <GmvChart points={data.gmv_by_day} currency={data.gmv_currency} />
            </Card>
          </View>

          <View className="mt-10 flex-col md:flex-row gap-6">
            <View className="flex-1">
              <Heading level={2}>Reconciliation</Heading>
              <Card className="mt-3 p-0 overflow-hidden">
                <View className="hidden md:flex md:flex-row md:bg-surface-alt md:px-5 md:py-3 md:border-b md:border-surface-border">
                  <Text variant="label" className="flex-1">Date</Text>
                  <Text variant="label" className="flex-1 text-right">Captures</Text>
                  <Text variant="label" className="flex-1 text-right">Refunds</Text>
                  <Text variant="label" className="flex-1 text-right">Payouts</Text>
                  <Text variant="label" className="flex-1 text-right">Net</Text>
                </View>
                {data.reconciliation.map((r, i) => (
                  <View
                    key={r.date}
                    className={`px-4 py-3 md:px-5 md:flex-row ${i < data.reconciliation.length - 1 ? 'border-b border-surface-border' : ''}`}
                  >
                    <Text variant="small" className="md:flex-1">{r.date}</Text>
                    <Text variant="small" className="md:flex-1 md:text-right">
                      {formatPrice(r.captures_cents, data.gmv_currency)}
                    </Text>
                    <Text variant="small" className="md:flex-1 md:text-right">
                      {formatPrice(r.refunds_cents, data.gmv_currency)}
                    </Text>
                    <Text variant="small" className="md:flex-1 md:text-right">
                      {formatPrice(r.payouts_cents, data.gmv_currency)}
                    </Text>
                    <Text variant="small" className="font-semibold md:flex-1 md:text-right">
                      {formatPrice(r.net_cents, data.gmv_currency)}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          </View>

          <View className="mt-10 flex-col md:flex-row gap-6">
            <View className="flex-1">
              <Heading level={2}>Payout queue</Heading>
              <Card className="mt-3 p-0 overflow-hidden">
                {data.payout_queue.map((p, i) => (
                  <View
                    key={p.id}
                    className={`px-4 py-3 md:px-5 ${i < data.payout_queue.length - 1 ? 'border-b border-surface-border' : ''}`}
                  >
                    <HStack className="justify-between gap-3">
                      <VStack className="flex-1 gap-0.5">
                        <Text className="font-semibold">{p.host_name}</Text>
                        <Text variant="small" className="text-ink-soft">
                          {p.scheduled_for}
                        </Text>
                      </VStack>
                      <Text className="font-semibold">
                        {formatPrice(p.amount_cents, data.gmv_currency)}
                      </Text>
                      <Badge
                        variant={
                          p.status === 'failed'
                            ? 'brand'
                            : p.status === 'sent'
                              ? 'neutral'
                              : 'dark'
                        }
                      >
                        {p.status}
                      </Badge>
                    </HStack>
                    {p.status === 'failed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 self-start"
                        onPress={() => toast.info('Preview only — would retry payout via Wise.')}
                      >
                        Retry
                      </Button>
                    ) : null}
                  </View>
                ))}
              </Card>
            </View>

            <View className="md:w-[360px]">
              <Heading level={2}>Chargebacks</Heading>
              <Card className="mt-3 p-5">
                <VStack className="gap-3">
                  {data.chargebacks.map((cb, i) => (
                    <View key={cb.id}>
                      <HStack className="justify-between">
                        <VStack className="flex-1 gap-0.5">
                          <Text className="font-semibold">
                            {formatPrice(cb.amount_cents, data.gmv_currency)}
                          </Text>
                          <Text variant="small" className="text-ink-soft">
                            {cb.booking_id} · opened {cb.opened_at}
                          </Text>
                        </VStack>
                        <Badge
                          variant={
                            cb.state === 'won' ? 'neutral' : cb.state === 'open' ? 'brand' : 'dark'
                          }
                        >
                          {cb.state}
                        </Badge>
                      </HStack>
                      {i < data.chargebacks.length - 1 ? (
                        <View className="mt-3 h-px bg-surface-border" />
                      ) : null}
                    </View>
                  ))}
                </VStack>
              </Card>
            </View>
          </View>
        </>
      )}
    </AdminShell>
  );
}

function GmvChart({
  points,
  currency,
}: {
  points: Array<{ date: string; gmv_cents: number }>;
  currency: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.gmv_cents));
  return (
    <View className="flex-row items-end gap-1 h-40">
      {points
        .slice()
        .reverse()
        .map((p) => {
          const height = (p.gmv_cents / max) * 100;
          return (
            <View key={p.date} className="flex-1 items-center gap-1">
              <View className="flex-1 w-full justify-end">
                <View
                  className="w-full rounded-t-sm bg-ink"
                  style={{ height: `${Math.max(2, height)}%` }}
                />
              </View>
              <Text variant="caption" className="text-ink-soft">
                {p.date.slice(5)}
              </Text>
            </View>
          );
        })}
      <View className="absolute right-0 top-0">
        <Text variant="caption" className="text-ink-soft">
          peak {formatPrice(max, currency)}
        </Text>
      </View>
    </View>
  );
}
