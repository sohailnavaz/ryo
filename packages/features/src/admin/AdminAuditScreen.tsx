'use client';

import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRealAuditLog, verifyAuditChain } from '@bnb/api';
import { Badge, Button, Card, HStack, Input, Skeleton, Text, toast, VStack } from '@bnb/ui';
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

// The audit log — the real, hash-chained one. (docs/15-admin-console.md §5)
//
// Previously this read a synthetic seed merged with a localStorage array, which made
// it a list of things that had happened *in this browser*. Evidence, it was not.
//
// Now it reads `audit_log`: append-only (an UPDATE or DELETE raises, for everyone,
// including admins) and hash-chained — each row's hash covers the previous row's, so
// editing history breaks every hash after it. "Verify chain" runs that check and is
// the only button on this page that matters.

export function AdminAuditScreen() {
  const [q, setQ] = useState('');
  const [checking, setChecking] = useState(false);
  const { data, isLoading } = useRealAuditLog(200);

  // Filtering a page you already hold is fine — this is a bounded, already-fetched
  // 200-row window, not a table scan pretending to be a search.
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data ?? [];
    return (data ?? []).filter(
      (a) =>
        a.action.toLowerCase().includes(needle) ||
        a.actor_name.toLowerCase().includes(needle) ||
        (a.reason_code ?? '').toLowerCase().includes(needle) ||
        a.subject_id?.toLowerCase().includes(needle),
    );
  }, [data, q]);

  async function onVerify() {
    setChecking(true);
    try {
      const breaks = await verifyAuditChain();
      if (breaks.length === 0) {
        toast.success('Chain intact — no row has been altered.');
      } else {
        toast.error(`Chain BROKEN at sequence ${breaks[0]?.broken_at}. History has been edited.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not verify the chain.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <AdminShell
      title="Audit log"
      subtitle="Every privileged action. Append-only and hash-chained — tampering is detectable."
    >
      <HStack className="mt-6 gap-3 items-center flex-wrap">
        <View className="flex-1 min-w-[240px]">
          <Input
            placeholder="Filter by action, actor, reason or subject id"
            value={q}
            onChangeText={setQ}
          />
        </View>
        <Button variant="outline" onPress={onVerify} loading={checking}>
          Verify chain
        </Button>
      </HStack>

      <View className="mt-4">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : rows.length === 0 ? (
          <Card className="p-10 items-center">
            <Text className="font-semibold">Nothing logged yet</Text>
            <Text variant="small" className="text-ink-soft mt-1 text-center">
              {q
                ? 'No entry matches that filter.'
                : 'No privileged action has been taken. That is the correct state for a quiet day.'}
            </Text>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            {rows.map((a, i) => (
              <View
                key={a.id}
                className={`px-5 py-3.5 ${i === rows.length - 1 ? '' : 'border-b border-surface-border'}`}
              >
                <HStack className="justify-between items-center gap-3 flex-wrap">
                  <HStack className="gap-2 items-center">
                    <Text variant="small" className="text-ink-soft">
                      #{a.seq}
                    </Text>
                    <Text className="font-semibold">{a.action}</Text>
                    {a.reason_code ? <Badge variant="neutral">{a.reason_code}</Badge> : null}
                  </HStack>
                  <Text variant="small" className="text-ink-soft">
                    {new Date(a.created_at).toLocaleString()}
                  </Text>
                </HStack>

                <VStack className="mt-1 gap-0.5">
                  <Text variant="small" className="text-ink-soft">
                    {a.actor_name} ({a.actor_role}) → {a.subject_type}:{a.subject_id?.slice(0, 8)}…
                  </Text>
                  {a.note ? (
                    <Text variant="small" className="text-ink-soft">
                      “{a.note}”
                    </Text>
                  ) : null}
                  {a.blast_radius && a.blast_radius.upcoming_bookings > 0 ? (
                    <Text variant="small" className="text-ink-soft">
                      Affected {a.blast_radius.upcoming_bookings} booking(s) worth{' '}
                      {formatPrice(a.blast_radius.upcoming_booking_value_cents, 'INR')}
                    </Text>
                  ) : null}
                </VStack>
              </View>
            ))}
          </Card>
        )}
      </View>
    </AdminShell>
  );
}
