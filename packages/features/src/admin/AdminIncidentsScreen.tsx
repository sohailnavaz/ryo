'use client';

import { useState } from 'react';
import { View } from 'react-native';
import {
  newIdempotencyKey,
  useAdminIncidentQueue,
  useReasonCodes,
  useRunAdminAction,
  type AdminIncidentRow,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  HStack,
  Pressable,
  ReasonCodeModal,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { AdminShell } from './shell';

// The incident console, on real data. (docs/15-admin-console.md, Phase 2)
//
// Previously: a synthetic seed of invented incidents, with "resolve" writing to
// localStorage. A guest could raise a real incident from /help and no staff member
// would ever see it — the console displayed fabricated ones instead. That is the most
// damaging kind of demo-ware, because it hides real distress behind fake work.
//
// Now it reads the `incidents` table, and assign/resolve go through `admin_action()`,
// which appends to the incident's timeline in the same transaction.

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Tier 1 · urgent',
  2: 'Tier 2 · same day',
  3: 'Tier 3 · routine',
};

/** First-response budget per tier (docs/12 §concierge SLA). */
const TIER_SLA_MINUTES: Record<1 | 2 | 3, number> = { 1: 60, 2: 480, 3: 1440 };

function slaState(i: AdminIncidentRow): { label: string; breached: boolean } {
  if (i.status === 'resolved') return { label: 'resolved', breached: false };
  const mins = (Date.now() - new Date(i.created_at).getTime()) / 60000;
  const budget = TIER_SLA_MINUTES[i.tier];
  if (mins > budget) return { label: 'SLA breached', breached: true };
  return { label: `${Math.max(0, Math.round(budget - mins))}m left`, breached: false };
}

export function AdminIncidentsScreen() {
  const [showResolved, setShowResolved] = useState(false);
  const [pending, setPending] = useState<AdminIncidentRow | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading } = useAdminIncidentQueue();
  const { data: reasons } = useReasonCodes('incident');
  const runAction = useRunAdminAction();

  const all = data ?? [];
  const open = all.filter((i) => i.status !== 'resolved');
  const resolved = all.filter((i) => i.status === 'resolved');
  const shown = showResolved ? resolved : open;

  async function assign(i: AdminIncidentRow) {
    try {
      await runAction.mutateAsync({
        action: 'incident.assign',
        subjectType: 'incident',
        subjectId: i.id,
        note: 'Taking this',
        idempotencyKey: newIdempotencyKey(),
      });
      toast.success('Assigned to you.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not assign that.');
    }
  }

  async function resolve(reason_code: string, note: string) {
    if (!pending) return;
    try {
      await runAction.mutateAsync({
        action: 'incident.resolve',
        subjectType: 'incident',
        subjectId: pending.id,
        reasonCode: reason_code,
        note,
        idempotencyKey: newIdempotencyKey(),
      });
      toast.success('Incident resolved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resolve that.');
    } finally {
      setPending(null);
    }
  }

  return (
    <AdminShell
      title="Incidents"
      subtitle="Real incidents raised by real guests. Tier 1 means someone needs help now."
    >
      <HStack className="mt-6 gap-2">
        {([false, true] as const).map((r) => (
          <Pressable key={String(r)} onPress={() => setShowResolved(r)}>
            <View
              className={`px-3.5 py-2 rounded-full border ${
                showResolved === r ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
              }`}
            >
              <Text
                variant="small"
                className={showResolved === r ? 'text-surface font-semibold' : 'text-ink-soft'}
              >
                {r ? `Resolved · ${resolved.length}` : `Open · ${open.length}`}
              </Text>
            </View>
          </Pressable>
        ))}
      </HStack>

      <View className="mt-4">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : shown.length === 0 ? (
          <Card className="p-10 items-center">
            <Text className="font-semibold">
              {showResolved ? 'Nothing resolved yet' : 'No open incidents'}
            </Text>
            <Text variant="small" className="text-ink-soft mt-1 text-center">
              {showResolved
                ? 'Resolved incidents collect here.'
                : 'Nobody is currently having a bad stay. Keep it that way.'}
            </Text>
          </Card>
        ) : (
          <VStack className="gap-3">
            {shown.map((i) => {
              const sla = slaState(i);
              const isOpen = selected === i.id;
              return (
                <Card key={i.id} className="p-5">
                  <Pressable onPress={() => setSelected(isOpen ? null : i.id)}>
                    <HStack className="justify-between items-start gap-4 flex-wrap">
                      <VStack className="flex-1 gap-1 min-w-[220px]">
                        <HStack className="gap-2 items-center flex-wrap">
                          <Badge variant={i.tier === 1 ? 'brand' : 'neutral'}>{TIER_LABEL[i.tier]}</Badge>
                          <Badge variant="neutral">{i.status}</Badge>
                          {i.status !== 'resolved' ? (
                            <Badge variant={sla.breached ? 'brand' : 'neutral'}>{sla.label}</Badge>
                          ) : null}
                        </HStack>
                        <Text className="font-semibold">{i.subject}</Text>
                        <Text variant="small" className="text-ink-soft">
                          {i.guest_name} · {i.listing_title} · {new Date(i.created_at).toLocaleString()}
                        </Text>
                        {i.assignee_name ? (
                          <Text variant="small" className="text-ink-soft">
                            Assigned to {i.assignee_name}
                          </Text>
                        ) : null}
                      </VStack>

                      {i.status !== 'resolved' ? (
                        <HStack className="gap-2">
                          {!i.assigned_to ? (
                            <Button variant="outline" size="sm" onPress={() => assign(i)}>
                              Take it
                            </Button>
                          ) : null}
                          <Button size="sm" onPress={() => setPending(i)}>
                            Resolve…
                          </Button>
                        </HStack>
                      ) : null}
                    </HStack>
                  </Pressable>

                  {isOpen ? (
                    <View className="mt-4 pt-4 border-t border-surface-border">
                      <Text variant="small" className="mb-3">
                        {i.detail || 'No further detail was given.'}
                      </Text>
                      <Text variant="label" className="mb-2">
                        Timeline
                      </Text>
                      {i.events.length === 0 ? (
                        <Text variant="small" className="text-ink-soft">
                          Nothing has happened yet. That is the problem.
                        </Text>
                      ) : (
                        <VStack className="gap-2">
                          {i.events.map((e) => (
                            <HStack key={e.id} className="gap-2 items-start">
                              <Badge variant="neutral">{e.kind}</Badge>
                              <VStack className="flex-1">
                                <Text variant="small">{e.body}</Text>
                                <Text variant="small" className="text-ink-soft">
                                  {e.actor_label ?? 'system'} · {new Date(e.created_at).toLocaleString()}
                                </Text>
                              </VStack>
                            </HStack>
                          ))}
                        </VStack>
                      )}
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </VStack>
        )}
      </View>

      <ReasonCodeModal
        open={pending !== null}
        onClose={() => setPending(null)}
        onSubmit={({ reason_code, note }) => resolve(reason_code, note)}
        title={pending ? `Resolve “${pending.subject}”?` : ''}
        message="The guest sees this outcome. Say what actually happened."
        reasonCodes={(reasons ?? []).map((r) => ({ code: r.code, label: r.label }))}
        confirmLabel="Resolve"
        loading={runAction.isPending}
      />
    </AdminShell>
  );
}
