import { View } from 'react-native';
import { DEMO_HOST_ID, useHostBooking } from '@bnb/api';
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
import { HostShell } from './shell';

export function HostBookingDetailScreen({
  bookingId,
  hostId = DEMO_HOST_ID,
}: {
  bookingId: string;
  hostId?: string;
}) {
  const { data, isLoading } = useHostBooking(hostId, bookingId);
  const router = useRouter();

  if (isLoading) {
    return (
      <HostShell title="Booking" subtitle="Loading reservation…">
        <Skeleton className="mt-6 h-96 w-full" />
      </HostShell>
    );
  }

  if (!data) {
    return (
      <HostShell title="Booking not found" subtitle="Check the URL or return to bookings.">
        <Card className="mt-6 p-6">
          <Button variant="secondary" onPress={() => router.push('/host/bookings')}>
            Back to bookings
          </Button>
        </Card>
      </HostShell>
    );
  }

  return (
    <HostShell
      title={data.listing_title}
      subtitle={`${data.listing_city}, ${data.listing_country} · ${formatDateRange(data.start_date, data.end_date)}`}
    >
      <HStack className="mt-2 gap-2 flex-wrap">
        <Badge variant={data.status === 'in_stay' ? 'brand' : data.status === 'upcoming' ? 'dark' : 'neutral'}>
          {data.status === 'in_stay' ? 'in stay' : data.status}
        </Badge>
        <Badge variant="neutral">{data.nights} {data.nights === 1 ? 'night' : 'nights'}</Badge>
      </HStack>

      <View className="mt-6 flex-col md:flex-row gap-6">
        <View className="flex-1 gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Guest</Text>
            <HStack className="mt-3 gap-3 items-center">
              <Avatar src={data.guest_avatar} name={data.guest_name} size={56} />
              <VStack className="flex-1 gap-0.5">
                <Text className="font-semibold">{data.guest_name}</Text>
                <Text variant="small" className="text-ink-soft">{data.guest_email}</Text>
                <Text variant="small" className="text-ink-soft">{data.guest_phone}</Text>
              </VStack>
            </HStack>
            <Divider className="my-4" />
            <Row label="Check-in"  value={data.start_date} />
            <Row label="Check-out" value={data.end_date} />
            <Row label="Nights"    value={String(data.nights)} />
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Activity</Text>
            <VStack className="mt-3 gap-3">
              {data.events.map((e, i) => (
                <View key={i}>
                  <HStack className="gap-3 items-start">
                    <View className="h-2 w-2 rounded-full bg-brand-500 mt-2" />
                    <VStack className="flex-1 gap-0.5">
                      <Text className="font-semibold">{e.label}</Text>
                      <Text variant="small" className="text-ink-soft">
                        {e.actor} · {e.at}
                      </Text>
                    </VStack>
                  </HStack>
                </View>
              ))}
            </VStack>
          </Card>
        </View>

        <View className="md:w-[360px] gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Payout</Text>
            <View className="mt-3">
              <Row label="Booking total"     value={formatPrice(data.total_cents, data.currency)} />
              <Row label="Cleaning"          value={formatPrice(data.cleaning_fee_cents, data.currency)} />
              <Row label="Service fee"       value={`- ${formatPrice(data.service_fee_cents, data.currency)}`} />
              <Divider className="my-2" />
              <Row label="Net to you"        value={formatPrice(data.payout_cents, data.currency)} bold />
              <Text variant="small" className="text-ink-soft mt-2">
                Scheduled for {data.payout_date}
              </Text>
            </View>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Actions</Text>
            <VStack className="mt-3 gap-2">
              <Button
                variant="secondary"
                onPress={() => toast.info('Preview only — message would route to inbox.')}
              >
                Message {data.guest_name.split(' ')[0]}
              </Button>
              <Button
                variant="secondary"
                onPress={() => toast.info('Preview only — opens cancellation flow with reason code.')}
              >
                Cancel booking
              </Button>
            </VStack>
            <Text variant="caption" className="mt-3 text-ink-soft">
              All host actions are reversible within 1 hour and logged to the audit trail.
            </Text>
          </Card>
        </View>
      </View>

      <View className="mt-8">
        <Pressable onPress={() => router.push('/host/bookings')}>
          <Text className="text-ink-soft underline">← Back to all bookings</Text>
        </Pressable>
      </View>
    </HostShell>
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
