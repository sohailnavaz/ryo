import { useState } from 'react';
import { View } from 'react-native';
import { useAdminBooking, useAdminRefundBooking } from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Pressable,
  ReasonCodeModal,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

const REFUND_REASONS = [
  { code: 'host_cancellation', label: 'Host cancellation' },
  { code: 'cleanliness', label: 'Cleanliness issue' },
  { code: 'misrepresentation', label: 'Listing misrepresented' },
  { code: 'safety', label: 'Safety concern' },
  { code: 'goodwill', label: 'Goodwill' },
  { code: 'other', label: 'Other' },
];

export function AdminBookingDetailScreen({ bookingId }: { bookingId: string }) {
  const { data, isLoading } = useAdminBooking(bookingId);
  const [mode, setMode] = useState<'refund' | 'cancel' | null>(null);
  const refund = useAdminRefundBooking();
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
      <ReasonCodeModal
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode === 'cancel' ? 'Cancel this booking?' : 'Issue a full refund?'}
        message={
          mode === 'cancel'
            ? `Cancels the reservation and refunds ${formatPrice(data.total_cents, data.currency)} to the guest. Logged to the audit trail.`
            : `Refunds ${formatPrice(data.total_cents, data.currency)} to the guest without cancelling. Logged to the audit trail.`
        }
        reasonCodes={REFUND_REASONS}
        requireNote
        confirmLabel={mode === 'cancel' ? 'Cancel booking' : 'Issue refund'}
        destructive={mode === 'cancel'}
        loading={refund.isPending}
        onSubmit={({ reason_code, note }) =>
          refund.mutate(
            {
              bookingId: data.id,
              refunded_cents: data.total_cents,
              cancelled: mode === 'cancel',
              reason_code,
              note: note || undefined,
            },
            {
              onSuccess: () => {
                const wasCancel = mode === 'cancel';
                setMode(null);
                toast.success(wasCancel ? 'Booking cancelled and refunded.' : 'Full refund issued.');
              },
              onError: () => toast.error('Could not process. Try again.'),
            },
          )
        }
      />
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
                variant={data.status === 'cancelled' ? 'outline' : 'danger'}
                disabled={data.status === 'cancelled'}
                onPress={() => setMode('cancel')}
              >
                {data.status === 'cancelled' ? 'Cancelled' : 'Cancel booking'}
              </Button>
              <Button
                variant="outline"
                disabled={data.payment.refunded_cents >= data.total_cents}
                onPress={() => setMode('refund')}
              >
                {data.payment.refunded_cents >= data.total_cents ? 'Refunded' : 'Issue refund'}
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
