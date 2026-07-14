'use client';

import { useState } from 'react';
import { View } from 'react-native';
import {
  newIdempotencyKey,
  previewAdminAction,
  useAdminBookingFull,
  useReasonCodes,
  useRunAdminAction,
} from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  ReasonCodeModal,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

// The booking inspector, on real data. (docs/15-admin-console.md, Phase 2)
//
// Cancel goes through `admin_action()` — reason-coded, audited, atomic.
//
// REFUND IS DELIBERATELY ABSENT. It is registered in the action registry but
// DISABLED, because moving money without a double-entry ledger is how a marketplace
// quietly loses track of what it owes. The old screen had a "Refund" button that
// wrote to localStorage and toasted success — the most dangerous button in the repo.
// It comes back in Phase 3, on top of a real ledger.

export function AdminBookingDetailScreen({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { data, isLoading } = useAdminBookingFull(bookingId);
  const { data: reasons } = useReasonCodes('booking');
  const runAction = useRunAdminAction();

  const [pending, setPending] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AdminShell title="Booking" subtitle="Loading…">
        <Skeleton className="mt-6 h-96 w-full" />
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell title="Booking not found" subtitle="No booking carries that id.">
        <Button variant="outline" className="mt-6 self-start" onPress={() => router.push('/admin/bookings')}>
          Back to bookings
        </Button>
      </AdminShell>
    );
  }

  const cancelled = data.status === 'cancelled';
  const b = data.breakdown;
  const hasBreakdown = b.subtotal_cents != null;

  async function askCancel() {
    try {
      const p = await previewAdminAction({
        action: 'booking.cancel',
        subjectType: 'booking',
        subjectId: bookingId,
      });
      const r = p.blast_radius;
      setPending(
        `Cancels a ${data!.nights}-night stay worth ${formatPrice(
          r?.upcoming_booking_value_cents ?? data!.total_cents,
          data!.currency,
        )}. ${data!.guest_name} is notified. No money moves — refunds need the ledger (Phase 3).`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not preview that.');
    }
  }

  async function commit(reason_code: string, note: string) {
    try {
      await runAction.mutateAsync({
        action: 'booking.cancel',
        subjectType: 'booking',
        subjectId: bookingId,
        reasonCode: reason_code,
        note,
        idempotencyKey: newIdempotencyKey(),
      });
      toast.success('Booking cancelled.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That did not complete.');
    } finally {
      setPending(null);
    }
  }

  return (
    <AdminShell title={data.listing_title} subtitle={`${data.city}, ${data.country} · ${data.nights} nights`}>
      <Card className="mt-6 p-5">
        <HStack className="justify-between items-start gap-4 flex-wrap">
          <VStack className="gap-1 flex-1 min-w-[220px]">
            <HStack className="gap-2 items-center flex-wrap">
              <Badge variant={cancelled ? 'brand' : 'neutral'}>{data.display_status.replace('_', ' ')}</Badge>
              <Text variant="small" className="text-ink-soft">
                {data.start_date} → {data.end_date}
              </Text>
            </HStack>
            <Text className="text-lg font-semibold">{formatPrice(data.total_cents, data.currency)}</Text>
            <Text variant="small" className="text-ink-soft">
              Booked {new Date(data.created_at).toLocaleDateString()} · id {data.id.slice(0, 8)}…
            </Text>
          </VStack>

          {!cancelled ? (
            <Button variant="outline" onPress={askCancel}>
              Cancel booking…
            </Button>
          ) : null}
        </HStack>

        <Divider className="my-5" />

        <HStack className="gap-8 flex-wrap">
          <VStack className="gap-1">
            <Text variant="label">Guest</Text>
            <HStack className="gap-2 items-center">
              <Avatar name={data.guest_name} size={28} />
              <VStack>
                <Text variant="small">{data.guest_name}</Text>
                <Text variant="small" className="text-ink-soft">
                  {data.guest_email}
                </Text>
              </VStack>
            </HStack>
          </VStack>

          <VStack className="gap-1">
            <Text variant="label">Host</Text>
            <HStack className="gap-2 items-center">
              <Avatar name={data.host_name} size={28} />
              <Text variant="small">{data.host_name}</Text>
            </HStack>
          </VStack>

          <VStack className="gap-1">
            <Text variant="label">Party</Text>
            <Text variant="small" className="text-ink-soft">
              {data.guests.adults ?? '—'} adults · {data.guests.children ?? 0} children ·{' '}
              {data.guests.infants ?? 0} infants · {data.guests.pets ?? 0} pets
            </Text>
          </VStack>
        </HStack>
      </Card>

      <Card className="mt-4 p-5 gap-2">
        <Text variant="label" className="mb-1">
          Price breakdown
        </Text>
        {hasBreakdown ? (
          <>
            <Line label="Subtotal" cents={b.subtotal_cents} currency={data.currency} />
            <Line label="Cleaning fee" cents={b.cleaning_fee_cents} currency={data.currency} />
            <Line label="Service fee" cents={b.service_fee_cents} currency={data.currency} />
            <Line label="Taxes" cents={b.taxes_cents} currency={data.currency} />
            {b.discount_cents ? (
              <Line label="Discount" cents={-b.discount_cents} currency={data.currency} />
            ) : null}
            <Divider className="my-2" />
            <HStack className="justify-between">
              <Text className="font-semibold">Total</Text>
              <Text className="font-semibold">{formatPrice(data.total_cents, data.currency)}</Text>
            </HStack>
          </>
        ) : (
          // Honest about missing data rather than inventing a plausible-looking split.
          <Text variant="small" className="text-ink-soft">
            Not recorded — this booking predates the fee-breakdown columns (migration 0004). Total
            was {formatPrice(data.total_cents, data.currency)}.
          </Text>
        )}
      </Card>

      {data.incidents.length > 0 ? (
        <Card className="mt-4 p-5">
          <Text variant="label" className="mb-2">
            Incidents on this booking
          </Text>
          <VStack className="gap-2">
            {data.incidents.map((i) => (
              <HStack key={i.id} className="gap-2 items-center">
                <Badge variant={i.tier === 1 ? 'brand' : 'neutral'}>tier {i.tier}</Badge>
                <Text variant="small" className="flex-1">
                  {i.subject}
                </Text>
                <Badge variant="neutral">{i.status}</Badge>
              </HStack>
            ))}
          </VStack>
        </Card>
      ) : null}

      <Card className="mt-4 p-5">
        <Text variant="label" className="mb-2">
          Audit trail
        </Text>
        {data.audit_trail.length === 0 ? (
          <Text variant="small" className="text-ink-soft">
            No staff action has been taken on this booking.
          </Text>
        ) : (
          <VStack className="gap-2">
            {data.audit_trail.map((a) => (
              <VStack key={a.id} className="gap-0.5">
                <HStack className="justify-between">
                  <Text variant="small" className="font-medium">
                    {a.action}
                  </Text>
                  <Text variant="small" className="text-ink-soft">
                    {new Date(a.created_at).toLocaleString()}
                  </Text>
                </HStack>
                <Text variant="small" className="text-ink-soft">
                  {a.actor_name} ({a.actor_role}){a.reason_code ? ` · ${a.reason_code}` : ''}
                  {a.note ? ` · ${a.note}` : ''}
                </Text>
              </VStack>
            ))}
          </VStack>
        )}
      </Card>

      <ReasonCodeModal
        open={pending !== null}
        onClose={() => setPending(null)}
        onSubmit={({ reason_code, note }) => commit(reason_code, note)}
        title="Cancel this booking?"
        message={pending ?? undefined}
        reasonCodes={(reasons ?? []).map((r) => ({ code: r.code, label: r.label }))}
        confirmLabel="Cancel booking"
        destructive
        loading={runAction.isPending}
      />
    </AdminShell>
  );
}

function Line({
  label,
  cents,
  currency,
}: {
  label: string;
  cents: number | null;
  currency: string;
}) {
  if (cents == null) return null;
  return (
    <HStack className="justify-between">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text variant="small">{formatPrice(cents, currency)}</Text>
    </HStack>
  );
}
