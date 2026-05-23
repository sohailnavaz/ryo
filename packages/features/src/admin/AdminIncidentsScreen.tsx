import { useState } from 'react';
import { View } from 'react-native';
import { useAdminIncidents, useAdminSetIncidentState, type AdminIncident } from '@bnb/api';
import {
  Avatar,
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

const TIERS = [1, 2, 3] as const;

const RESOLVE_REASONS = [
  { code: 'resolved_guest', label: 'Resolved with guest' },
  { code: 'resolved_host', label: 'Resolved with host' },
  { code: 'rebooked', label: 'Guest rebooked' },
  { code: 'refunded', label: 'Refund issued' },
  { code: 'no_action', label: 'No action needed' },
  { code: 'other', label: 'Other' },
];

export function AdminIncidentsScreen() {
  const { data, isLoading } = useAdminIncidents();
  const [selected, setSelected] = useState<AdminIncident | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const setIncidentState = useAdminSetIncidentState();

  // Keep the detail pane in sync with refreshed query data after a mutation.
  const current = selected ? (data?.find((i) => i.id === selected.id) ?? selected) : null;

  return (
    <AdminShell
      title="Incidents"
      subtitle="Severity-tiered queues. Tier 1 = active impact; Tier 3 = informational."
    >
      {current ? (
        <ReasonCodeModal
          open={resolveOpen}
          onClose={() => setResolveOpen(false)}
          title={`Resolve “${current.title}”?`}
          message="Closes the incident and records the outcome in the audit log."
          reasonCodes={RESOLVE_REASONS}
          requireNote
          confirmLabel="Resolve"
          loading={setIncidentState.isPending}
          onSubmit={({ reason_code, note }) =>
            setIncidentState.mutate(
              { incidentId: current.id, state: 'resolved', reason_code, note: note || undefined },
              {
                onSuccess: () => {
                  setResolveOpen(false);
                  toast.success('Incident resolved.');
                },
                onError: () => toast.error('Could not resolve. Try again.'),
              },
            )
          }
        />
      ) : null}
      <View className="mt-6">
        {isLoading || !data ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <View className="flex-col md:flex-row gap-6">
            <View className="flex-1 gap-6">
              {TIERS.map((tier) => {
                const items = data.filter((i) => i.tier === tier);
                return (
                  <View key={tier}>
                    <HStack className="gap-2 items-center">
                      <Text className="font-semibold">Tier {tier}</Text>
                      <Badge variant={tier === 1 ? 'brand' : 'neutral'}>{items.length}</Badge>
                    </HStack>
                    {items.length === 0 ? (
                      <Card className="mt-2 p-4 items-center">
                        <Text variant="small" className="text-ink-soft">
                          Nothing in this tier.
                        </Text>
                      </Card>
                    ) : (
                      <VStack className="mt-2 gap-2">
                        {items.map((i) => (
                          <Pressable key={i.id} onPress={() => setSelected(i)}>
                            <Card
                              className={`p-4 ${selected?.id === i.id ? 'border-2 border-ink' : ''}`}
                            >
                              <HStack className="justify-between gap-3">
                                <VStack className="flex-1 gap-0.5">
                                  <Text className="font-semibold" numberOfLines={1}>
                                    {i.title}
                                  </Text>
                                  <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                                    {i.user_name} · opened {i.opened_at}
                                  </Text>
                                </VStack>
                                <Badge
                                  variant={
                                    i.state === 'resolved'
                                      ? 'neutral'
                                      : i.state === 'new'
                                        ? 'brand'
                                        : 'dark'
                                  }
                                >
                                  {i.state.replace('_', ' ')}
                                </Badge>
                              </HStack>
                            </Card>
                          </Pressable>
                        ))}
                      </VStack>
                    )}
                  </View>
                );
              })}
            </View>

            <View className="md:w-[400px]">
              {current ? (
                <Card className="p-5">
                  <Badge
                    className="self-start"
                    variant={current.tier === 1 ? 'brand' : 'neutral'}
                  >
                    Tier {current.tier}
                  </Badge>
                  <Text className="mt-3 font-semibold">{current.title}</Text>
                  <HStack className="mt-3 gap-3 items-center">
                    <Avatar name={current.user_name} size={36} />
                    <VStack className="flex-1 gap-0.5">
                      <Text className="font-semibold">{current.user_name}</Text>
                      {current.booking_id ? (
                        <Text variant="small" className="text-ink-soft">
                          {current.booking_id}
                        </Text>
                      ) : null}
                    </VStack>
                    <Badge
                      variant={
                        current.state === 'resolved'
                          ? 'neutral'
                          : current.state === 'new'
                            ? 'brand'
                            : 'dark'
                      }
                    >
                      {current.state.replace('_', ' ')}
                    </Badge>
                  </HStack>
                  <Text variant="small" className="mt-3 text-ink-soft">
                    Opened {current.opened_at}
                    {current.assigned_to ? ` · assigned to ${current.assigned_to}` : ''}
                  </Text>
                  <View className="mt-3 rounded-xl bg-surface-alt px-3 py-3">
                    <Text variant="small">{current.summary}</Text>
                  </View>

                  <VStack className="mt-4 gap-2">
                    <Button
                      variant="secondary"
                      disabled={current.state === 'resolved' || setIncidentState.isPending}
                      onPress={() =>
                        setIncidentState.mutate(
                          { incidentId: current.id, state: 'in_progress', reason_code: 'self_assign' },
                          {
                            onSuccess: () => toast.success('Assigned to you.'),
                            onError: () => toast.error('Could not assign. Try again.'),
                          },
                        )
                      }
                    >
                      Assign to me
                    </Button>
                    <Button
                      variant="outline"
                      disabled={current.state === 'resolved'}
                      onPress={() => setResolveOpen(true)}
                    >
                      {current.state === 'resolved' ? 'Resolved' : 'Resolve'}
                    </Button>
                  </VStack>
                </Card>
              ) : (
                <Card className="p-6 items-center">
                  <Text className="text-ink-soft text-center">
                    Select an incident to see the full detail and actions.
                  </Text>
                </Card>
              )}
            </View>
          </View>
        )}
      </View>
    </AdminShell>
  );
}
