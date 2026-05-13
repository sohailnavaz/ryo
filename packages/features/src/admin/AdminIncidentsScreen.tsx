import { useState } from 'react';
import { View } from 'react-native';
import { useAdminIncidents, type AdminIncident } from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  HStack,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { AdminShell } from './shell';

const TIERS = [1, 2, 3] as const;

export function AdminIncidentsScreen() {
  const { data, isLoading } = useAdminIncidents();
  const [selected, setSelected] = useState<AdminIncident | null>(null);

  return (
    <AdminShell
      title="Incidents"
      subtitle="Severity-tiered queues. Tier 1 = active impact; Tier 3 = informational."
    >
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
              {selected ? (
                <Card className="p-5">
                  <Badge
                    className="self-start"
                    variant={selected.tier === 1 ? 'brand' : 'neutral'}
                  >
                    Tier {selected.tier}
                  </Badge>
                  <Text className="mt-3 font-semibold">{selected.title}</Text>
                  <HStack className="mt-3 gap-3 items-center">
                    <Avatar name={selected.user_name} size={36} />
                    <VStack className="flex-1 gap-0.5">
                      <Text className="font-semibold">{selected.user_name}</Text>
                      {selected.booking_id ? (
                        <Text variant="small" className="text-ink-soft">
                          {selected.booking_id}
                        </Text>
                      ) : null}
                    </VStack>
                    <Badge
                      variant={
                        selected.state === 'resolved'
                          ? 'neutral'
                          : selected.state === 'new'
                            ? 'brand'
                            : 'dark'
                      }
                    >
                      {selected.state.replace('_', ' ')}
                    </Badge>
                  </HStack>
                  <Text variant="small" className="mt-3 text-ink-soft">
                    Opened {selected.opened_at}
                    {selected.assigned_to ? ` · assigned to ${selected.assigned_to}` : ''}
                  </Text>
                  <View className="mt-3 rounded-xl bg-surface-alt px-3 py-3">
                    <Text variant="small">{selected.summary}</Text>
                  </View>

                  <VStack className="mt-4 gap-2">
                    <Button
                      variant="secondary"
                      onPress={() =>
                        toast.info('Preview only — opens assignment picker (concierge / T&S).')
                      }
                    >
                      Assign to me
                    </Button>
                    <Button
                      variant="outline"
                      onPress={() =>
                        toast.success('Preview only — would mark resolved with reason code.')
                      }
                    >
                      Resolve
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
