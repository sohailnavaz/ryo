import { useState } from 'react';
import { View } from 'react-native';
import {
  DEMO_HOST_ID,
  useHostBooking,
  useHostCancelBooking,
  useHostDecideBooking,
} from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmModal,
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
import { AddToCalendar } from '../shared/AddToCalendar';
import { HostShell } from './shell';

const DECLINE_REASONS = [
  { code: 'dates_unavailable', label: 'Dates no longer available' },
  { code: 'guest_fit', label: 'Not a fit for the home' },
  { code: 'maintenance', label: 'Maintenance / repairs' },
  { code: 'pricing', label: 'Pricing / length of stay' },
  { code: 'other', label: 'Other' },
];

const CANCEL_REASONS = [
  { code: 'maintenance', label: 'Urgent maintenance' },
  { code: 'double_booking', label: 'Double booking' },
  { code: 'personal', label: 'Personal emergency' },
  { code: 'guest_request', label: 'Guest asked to cancel' },
  { code: 'other', label: 'Other' },
];

export function HostBookingDetailScreen({
  bookingId,
  hostId = DEMO_HOST_ID,
}: {
  bookingId: string;
  hostId?: string;
}) {
  const { data, isLoading } = useHostBooking(hostId, bookingId);
  const router = useRouter();
  const decide = useHostDecideBooking();
  const cancel = useHostCancelBooking();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

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

  const isPendingRequest = data.is_request && data.request_state === 'pending';
  const isCancelled = data.status === 'cancelled';
  // A confirmed, not-yet-finished booking can be host-cancelled.
  const canHostCancel = !isCancelled && !isPendingRequest && data.status !== 'completed';

  return (
    <HostShell
      title={data.listing_title}
      subtitle={`${data.listing_city}, ${data.listing_country} · ${formatDateRange(data.start_date, data.end_date)}`}
    >
      <ConfirmModal
        open={acceptOpen}
        onClose={() => setAcceptOpen(false)}
        title={`Accept ${data.guest_name.split(' ')[0]}'s request?`}
        message={`Confirms the stay for ${formatDateRange(data.start_date, data.end_date)} and authorises payment. The guest is notified immediately.`}
        confirmLabel="Accept request"
        loading={decide.isPending}
        onConfirm={() =>
          decide.mutate(
            { bookingId: data.id, decision: 'accepted', reason_code: 'host_accept' },
            {
              onSuccess: () => {
                setAcceptOpen(false);
                toast.success('Request accepted.');
              },
              onError: () => toast.error('Could not accept. Try again.'),
            },
          )
        }
      />
      <ReasonCodeModal
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title={`Decline ${data.guest_name.split(' ')[0]}'s request?`}
        message="The guest is notified and not charged. Declining too often can affect placement."
        reasonCodes={DECLINE_REASONS}
        confirmLabel="Decline request"
        destructive
        loading={decide.isPending}
        onSubmit={({ reason_code, note }) =>
          decide.mutate(
            { bookingId: data.id, decision: 'declined', reason_code, note: note || undefined },
            {
              onSuccess: () => {
                setDeclineOpen(false);
                toast.success('Request declined.');
              },
              onError: () => toast.error('Could not decline. Try again.'),
            },
          )
        }
      />
      <ReasonCodeModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this booking?"
        message={`Host cancellations carry a penalty. Estimated charge to you: ${formatPrice(data.host_penalty_cents, data.currency)}, the guest is fully refunded, and the dates reopen. This is logged.`}
        reasonCodes={CANCEL_REASONS}
        requireNote
        notePlaceholder="Explain the cancellation for the guest + record…"
        confirmLabel="Cancel booking"
        destructive
        loading={cancel.isPending}
        onSubmit={({ reason_code, note }) =>
          cancel.mutate(
            {
              bookingId: data.id,
              penalty_cents: data.host_penalty_cents,
              reason_code,
              note: note || undefined,
            },
            {
              onSuccess: () => {
                setCancelOpen(false);
                toast.success('Booking cancelled. Guest refunded.');
              },
              onError: () => toast.error('Could not cancel. Try again.'),
            },
          )
        }
      />

      <HStack className="mt-2 gap-2 flex-wrap">
        {isPendingRequest ? (
          <Badge variant="brand">request · action needed</Badge>
        ) : (
          <Badge variant={data.status === 'in_stay' ? 'brand' : data.status === 'upcoming' ? 'dark' : 'neutral'}>
            {data.status === 'in_stay' ? 'in stay' : data.status}
          </Badge>
        )}
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
              {isPendingRequest ? (
                <>
                  <Button variant="primary" onPress={() => setAcceptOpen(true)}>
                    Accept request
                  </Button>
                  <Button variant="danger" onPress={() => setDeclineOpen(true)}>
                    Decline request
                  </Button>
                </>
              ) : null}
              <Button
                variant="secondary"
                onPress={() => toast.info('Preview only — message would route to inbox.')}
              >
                Message {data.guest_name.split(' ')[0]}
              </Button>
              {canHostCancel ? (
                <Button variant="outline" onPress={() => setCancelOpen(true)}>
                  Cancel booking
                </Button>
              ) : null}
              {!isCancelled ? (
                <AddToCalendar
                  fullWidth
                  variant="ghost"
                  label="Add to calendar"
                  hint="Add this reservation's check-in and check-out to your calendar."
                  event={{
                    title: `Ryo guest — ${data.guest_name} · ${data.listing_title}`,
                    location: [data.listing_city, data.listing_country]
                      .filter(Boolean)
                      .join(', '),
                    start: data.start_date,
                    end: data.end_date,
                    details: `${data.guest_name} checks in at ${data.listing_title}.\n${
                      data.nights
                    } ${data.nights === 1 ? 'night' : 'nights'} · ${formatDateRange(
                      data.start_date,
                      data.end_date,
                    )}.`,
                  }}
                />
              ) : null}
            </VStack>
            {data.cancellation ? (
              <View className="mt-3 rounded-2xl bg-surface-alt px-3 py-2">
                <Text variant="small" className="font-semibold">Cancelled by you</Text>
                <Text variant="caption" className="text-ink-soft mt-0.5">
                  {data.cancellation.reason_code.replace(/_/g, ' ')} · penalty{' '}
                  {formatPrice(data.cancellation.penalty_cents, data.currency)} · {data.cancellation.cancelled_at}
                </Text>
              </View>
            ) : null}
            <Text variant="caption" className="mt-3 text-ink-soft">
              Every host action is logged to the audit trail. Host cancellations carry a penalty.
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
