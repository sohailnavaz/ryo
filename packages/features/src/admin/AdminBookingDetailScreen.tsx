import { View } from 'react-native';
import { useAdminBooking } from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

export function AdminBookingDetailScreen({ bookingId }: { bookingId: string }) {
  const { data, isLoading } = useAdminBooking(bookingId);
  const router = useRouter();

  if (isLoading) {
    return (
      <AdminShell title="Booking" subtitle="Loading…">
        <Skeleton className="mt-6 h-96 w-full" />
      </AdminShell>
    );
  }
  if (!data) {
    return (
      <AdminShell title="Booking not found" subtitle="Check the id.">
        <Card className="mt-6 p-6">
          <Button variant="secondary" onPress={() => router.push('/admin/bookings')}>
            Back to bookings
          </Button>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={data.listing_title}
      subtitle={`${data.listing_city}, ${data.listing_country} · ${formatDateRange(data.start_date, data.end_date)}`}
    >
      <HStack className="mt-2 gap-2 flex-wrap">
        <Badge variant={data.status === 'in_stay' ? 'brand' : data.status === 'upcoming' ? 'dark' : 'neutral'}>
          {data.status}
        </Badge>
        <Badge variant="neutral">id: {data.id}</Badge>
      </HStack>

      <View className="mt-6 flex-col md:flex-row gap-6">
        <View className="flex-1 gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Guest</Text>
            <HStack className="mt-3 gap-3 items-center">
              <Avatar src={data.guest_avatar} name={data.guest_name} size={48} />
              <VStack className="flex-1 gap-0.5">
                <Text className="font-semibold">{data.guest_name}</Text>
                <Text variant="small" className="text-ink-soft">{data.nights} nights · {data.listing_city}</Text>
              </VStack>
            </HStack>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Activity</Text>
            <VStack className="mt-3 gap-3">
              {data.events.map((e, i) => (
                <HStack key={i} className="gap-3 items-start">
                  <View className="h-2 w-2 rounded-full bg-brand-500 mt-2" />
                  <VStack className="flex-1 gap-0.5">
                    <Text className="font-semibold">{e.label}</Text>
                    <Text variant="small" className="text-ink-soft">
                      {e.actor} · {e.at}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </Card>
        </View>

        <View className="md:w-[360px] gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Payment trail</Text>
            <View className="mt-3">
              <Row label="Method"      value={data.payment.method} />
              <Row label="Authorised"  value={formatPrice(data.payment.authorised_cents, data.currency)} />
              <Row label="Captured"    value={formatPrice(data.payment.captured_cents, data.currency)} />
              <Row label="Refunded"    value={formatPrice(data.payment.refunded_cents, data.currency)} />
              <Divider className="my-2" />
              <Row label="Host payout" value={formatPrice(data.payout_cents, data.currency)} bold />
              <Text variant="small" className="text-ink-soft mt-2">
                Scheduled for {data.payout_date}
              </Text>
            </View>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Privileged actions</Text>
            <VStack className="mt-3 gap-2">
              <Button
                variant="outline"
                onPress={() =>
                  toast.info('Preview only — opens cancellation flow with reason code.')
                }
              >
                Cancel booking
              </Button>
              <Button
                variant="outline"
                onPress={() =>
                  toast.info('Preview only — opens partial / full refund modal.')
                }
              >
                Issue refund
              </Button>
              <Button
                variant="outline"
                onPress={() => toast.info('Preview only — credit issuance flow.')}
              >
                Goodwill credit
              </Button>
              <Button
                variant="outline"
                onPress={() => toast.info('Preview only — escalates to concierge.')}
              >
                Escalate
              </Button>
            </VStack>
            <Text variant="caption" className="mt-3 text-ink-soft">
              Every action requires a reason code, writes to the audit log, and is reversible within 1 hour.
            </Text>
          </Card>
        </View>
      </View>

      <View className="mt-8">
        <Pressable onPress={() => router.push('/admin/bookings')}>
          <Text className="text-ink-soft underline">← Back to all bookings</Text>
        </Pressable>
      </View>
    </AdminShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <HStack className="justify-between py-1">
      <Text variant="small" className="text-ink-soft">{label}</Text>
      <Text className={bold ? 'font-semibold' : ''}>{value}</Text>
    </HStack>
  );
}
