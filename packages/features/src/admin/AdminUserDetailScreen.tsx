'use client';

import { useState } from 'react';
import { View } from 'react-native';
import {
  newIdempotencyKey,
  previewAdminAction,
  useAdminUserFull,
  useReasonCodes,
  useRole,
  useRunAdminAction,
  type AdminActionName,
} from '@bnb/api';
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
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

// The user inspector, on real data. (docs/15-admin-console.md, Phase 2)
//
// Two things were wrong before:
//   1. It read a SYNTHETIC seed keyed on ids like `u3` — so once Phase 1 made the
//      list serve real uuids, every row landed on "User not found".
//   2. Suspending wrote to a browser-local override store, meaning the suspension
//      existed only on the machine that performed it and vanished on another device.
//
// Now it reads `admin_get_user()` and writes through `admin_action()`: one atomic
// transaction, a hash-chained audit row, an event — and a blast-radius preview first.
//
// Reason codes come from the `reason_codes` table rather than being hardcoded. The
// old screen invented its own (`ts_pattern`, `fraud_risk`), which the server would
// now correctly reject as invalid for a user action.

type Tab = 'profile' | 'bookings' | 'listings' | 'audit';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'listings', label: 'Listings' },
  { key: 'audit', label: 'Audit trail' },
];

export function AdminUserDetailScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const { role } = useRole();
  const isAdmin = role === 'admin';

  const [unmask, setUnmask] = useState(false);
  const [tab, setTab] = useState<Tab>('profile');
  const [pending, setPending] = useState<{ action: AdminActionName; radius: string } | null>(null);

  const { data, isLoading } = useAdminUserFull(userId, unmask && isAdmin);
  const { data: reasons } = useReasonCodes('user');
  const runAction = useRunAdminAction();

  if (isLoading) {
    return (
      <AdminShell title="User" subtitle="Loading…">
        <Skeleton className="mt-6 h-96 w-full" />
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell title="User not found" subtitle="No account carries that id.">
        <Button
          variant="outline"
          className="mt-6 self-start"
          onPress={() => router.push('/admin/users')}
        >
          Back to users
        </Button>
      </AdminShell>
    );
  }

  const suspended = data.status === 'suspended';

  // Never open a confirm dialog without first asking the server what the action would
  // actually do. Suspending a host with live bookings is not the same decision as
  // suspending a dormant guest, and the operator deserves to know which one this is.
  async function askThen(action: AdminActionName) {
    try {
      const p = await previewAdminAction({ action, subjectType: 'user', subjectId: userId });
      const b = p.blast_radius;
      const heavy = b && (b.upcoming_bookings > 0 || (b.listings_affected ?? 0) > 0);
      setPending({
        action,
        radius: heavy
          ? `Affects ${b.listings_affected ?? 0} listing(s) and ${b.upcoming_bookings} upcoming booking(s) worth ${formatPrice(
              b.upcoming_booking_value_cents,
              'INR',
            )} · ${b.guests_notified} guest(s) would be notified.`
          : 'No upcoming bookings are affected.',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not preview that action.');
    }
  }

  async function commit(reason_code: string, note: string) {
    if (!pending) return;
    const action = pending.action;
    try {
      await runAction.mutateAsync({
        action,
        subjectType: 'user',
        subjectId: userId,
        reasonCode: reason_code,
        note,
        idempotencyKey: newIdempotencyKey(),
      });
      toast.success(action === 'user.suspend' ? 'Account suspended.' : 'Account reinstated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That action did not complete.');
    } finally {
      setPending(null);
    }
  }

  return (
    <AdminShell
      title={data.display_name}
      subtitle={`${data.role} · joined ${new Date(data.created_at).toLocaleDateString()}`}
    >
      <Card className="mt-6 p-5">
        <HStack className="gap-4 items-center flex-wrap">
          <Avatar name={data.display_name} size={56} />
          <VStack className="flex-1 gap-1 min-w-[220px]">
            <HStack className="gap-2 items-center flex-wrap">
              <Text className="text-lg font-semibold">{data.display_name}</Text>
              <Badge variant={suspended ? 'brand' : 'neutral'}>{data.status}</Badge>
              <Badge variant={data.role === 'admin' || data.role === 'staff' ? 'dark' : 'neutral'}>
                {data.role}
              </Badge>
            </HStack>
            <HStack className="gap-2 items-center">
              <Text variant="small" className="text-ink-soft">
                {data.email}
              </Text>
              {isAdmin ? (
                <Pressable onPress={() => setUnmask((u) => !u)}>
                  <Badge variant={unmask ? 'brand' : 'neutral'}>{unmask ? 'shown' : 'reveal'}</Badge>
                </Pressable>
              ) : null}
            </HStack>
            {suspended && data.suspended_reason ? (
              <Text variant="small" className="text-ink-soft">
                Suspended
                {data.suspended_at ? ` ${new Date(data.suspended_at).toLocaleDateString()}` : ''} ·{' '}
                {data.suspended_reason}
              </Text>
            ) : null}
          </VStack>

          {suspended ? (
            <Button variant="outline" onPress={() => askThen('user.reinstate')}>
              Reinstate
            </Button>
          ) : (
            <Button variant="outline" onPress={() => askThen('user.suspend')}>
              Suspend…
            </Button>
          )}
        </HStack>

        <Divider className="my-5" />

        <HStack className="gap-6 flex-wrap">
          <Stat label="Trips" value={String(data.bookings_count)} />
          <Stat label="Nights" value={String(data.nights)} />
          <Stat
            label="Lifetime spend"
            value={data.ltv_cents > 0 ? formatPrice(data.ltv_cents, 'INR') : '—'}
          />
          <Stat label="Listings" value={String(data.listings_count)} />
          <Stat
            label="Last seen"
            value={data.last_sign_in_at ? new Date(data.last_sign_in_at).toLocaleDateString() : 'never'}
          />
        </HStack>
      </Card>

      <HStack className="mt-6 gap-2 flex-wrap">
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)}>
            <View
              className={`px-3.5 py-2 rounded-full border ${
                tab === t.key ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
              }`}
            >
              <Text
                variant="small"
                className={tab === t.key ? 'text-surface font-semibold' : 'text-ink-soft'}
              >
                {t.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </HStack>

      <View className="mt-4">
        {tab === 'profile' ? (
          <Card className="p-5 gap-3">
            <Row label="User id" value={data.id} />
            <Row label="Email" value={data.email} />
            <Row label="Role" value={data.role} />
            <Row label="Joined" value={new Date(data.created_at).toLocaleString()} />
            <Row
              label="Open incidents"
              value={String(data.incidents.filter((i) => i.status !== 'resolved').length)}
            />
          </Card>
        ) : null}

        {tab === 'bookings' ? (
          data.bookings.length === 0 ? (
            <Empty text="No bookings yet." />
          ) : (
            <Card className="p-0 overflow-hidden">
              {data.bookings.map((b, i) => (
                <View
                  key={b.id}
                  className={`px-5 py-3 flex-row items-center justify-between ${
                    i === data.bookings.length - 1 ? '' : 'border-b border-surface-border'
                  }`}
                >
                  <VStack className="flex-1 gap-0.5">
                    <Text className="font-medium">{b.listing_title}</Text>
                    <Text variant="small" className="text-ink-soft">
                      {b.start_date} → {b.end_date}
                    </Text>
                  </VStack>
                  <HStack className="gap-3 items-center">
                    <Text variant="small">{formatPrice(b.total_cents, b.currency)}</Text>
                    <Badge variant={b.status === 'cancelled' ? 'brand' : 'neutral'}>{b.status}</Badge>
                  </HStack>
                </View>
              ))}
            </Card>
          )
        ) : null}

        {tab === 'listings' ? (
          data.listings.length === 0 ? (
            <Empty text="This account hosts no listings." />
          ) : (
            <Card className="p-0 overflow-hidden">
              {data.listings.map((l, i) => (
                <Pressable key={l.id} onPress={() => router.push(`/listing/${l.id}`)}>
                  <View
                    className={`px-5 py-3 flex-row items-center justify-between ${
                      i === data.listings.length - 1 ? '' : 'border-b border-surface-border'
                    }`}
                  >
                    <VStack className="flex-1 gap-0.5">
                      <Text className="font-medium">{l.title}</Text>
                      <Text variant="small" className="text-ink-soft">
                        {l.city}
                      </Text>
                    </VStack>
                    <Badge variant={l.moderation_status === 'approved' ? 'neutral' : 'brand'}>
                      {l.moderation_status}
                    </Badge>
                  </View>
                </Pressable>
              ))}
            </Card>
          )
        ) : null}

        {tab === 'audit' ? (
          data.audit_trail.length === 0 ? (
            <Empty text="No staff action has ever been taken on this account." />
          ) : (
            <Card className="p-0 overflow-hidden">
              {data.audit_trail.map((a, i) => (
                <View
                  key={a.id}
                  className={`px-5 py-3 ${
                    i === data.audit_trail.length - 1 ? '' : 'border-b border-surface-border'
                  }`}
                >
                  <HStack className="justify-between items-center">
                    <Text className="font-medium">{a.action}</Text>
                    <Text variant="small" className="text-ink-soft">
                      {new Date(a.created_at).toLocaleString()}
                    </Text>
                  </HStack>
                  <Text variant="small" className="text-ink-soft mt-0.5">
                    {a.actor_name} ({a.actor_role})
                    {a.reason_code ? ` · ${a.reason_code}` : ''}
                    {a.note ? ` · ${a.note}` : ''}
                  </Text>
                </View>
              ))}
            </Card>
          )
        ) : null}
      </View>

      <ReasonCodeModal
        open={pending !== null}
        onClose={() => setPending(null)}
        onSubmit={({ reason_code, note }) => commit(reason_code, note)}
        title={pending?.action === 'user.suspend' ? 'Suspend this account?' : 'Reinstate this account?'}
        message={pending?.radius}
        reasonCodes={(reasons ?? []).map((r) => ({ code: r.code, label: r.label }))}
        confirmLabel={pending?.action === 'user.suspend' ? 'Suspend' : 'Reinstate'}
        destructive={pending?.action === 'user.suspend'}
        loading={runAction.isPending}
      />
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <VStack className="gap-0.5">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text className="font-semibold">{value}</Text>
    </VStack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between items-center gap-4">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text variant="small" numberOfLines={1}>
        {value}
      </Text>
    </HStack>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="p-8 items-center">
      <Text className="text-ink-soft">{text}</Text>
    </Card>
  );
}
