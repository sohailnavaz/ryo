import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  incidentSla,
  useIncident,
  useIncidentEvents,
  useMyIncidents,
  useUser,
  type Incident,
  type IncidentSlaState,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Pressable,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { GetHelpSheet } from './GetHelpSheet';

const STATUS_LABEL: Record<Incident['status'], string> = {
  new: 'Received',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

function slaVariant(state: IncidentSlaState): 'neutral' | 'brand' | 'dark' {
  if (state === 'breached') return 'brand';
  if (state === 'due_soon') return 'dark';
  return 'neutral';
}

/**
 * Guest-facing "Help" — the other end of the support→incident loop. Lists the
 * cases this guest has opened, each with a live status + SLA, and a timeline of
 * what's happened. New requests open through the same `GetHelpSheet`.
 */
export function GuestIncidentsScreen() {
  const user = useUser();
  const { data, isLoading } = useMyIncidents(user?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="px-4 md:px-8 py-8 max-w-[1100px] mx-auto w-full">
      <GetHelpSheet
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onCreated={(id) => setSelectedId(id)}
      />

      <HStack className="justify-between items-center gap-3 flex-wrap">
        <VStack className="gap-1">
          <Heading level={2}>Help</Heading>
          <Text className="text-ink-soft">
            Track requests you've opened. We aim to respond fastest to anything urgent.
          </Text>
        </VStack>
        <Button variant="secondary" onPress={() => setHelpOpen(true)}>
          New request
        </Button>
      </HStack>

      <View className="mt-6 flex-col md:flex-row gap-6">
        <View className="flex-1 gap-3">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : !data || data.length === 0 ? (
            <Card className="p-6 items-center">
              <Text className="font-semibold">No open requests</Text>
              <Text variant="small" className="text-ink-soft text-center mt-1">
                If something's not right with a stay, tap “New request” and we'll help.
              </Text>
            </Card>
          ) : (
            data.map((i) => {
              const sla = incidentSla(i);
              return (
                <Pressable key={i.id} onPress={() => setSelectedId(i.id)}>
                  <Card className={`p-4 ${selectedId === i.id ? 'border-2 border-ink' : ''}`}>
                    <HStack className="justify-between gap-3 items-start">
                      <VStack className="flex-1 gap-0.5">
                        <Text className="font-semibold" numberOfLines={1}>
                          {i.subject}
                        </Text>
                        <Text variant="small" className="text-ink-soft">
                          Opened {i.created_at.slice(0, 10)}
                        </Text>
                      </VStack>
                      <Badge variant={i.status === 'resolved' ? 'neutral' : 'dark'}>
                        {STATUS_LABEL[i.status]}
                      </Badge>
                    </HStack>
                    <Badge className="mt-3" variant={slaVariant(sla.state)}>
                      {sla.label}
                    </Badge>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>

        <View className="md:w-[420px]">
          {selectedId ? (
            <IncidentDetail incidentId={selectedId} />
          ) : (
            <Card className="p-6 items-center">
              <Text className="text-ink-soft text-center">
                Select a request to see its status and updates.
              </Text>
            </Card>
          )}
        </View>
      </View>
      </View>
    </ScrollView>
  );
}

function IncidentDetail({ incidentId }: { incidentId: string }) {
  const { data: incident, isLoading } = useIncident(incidentId);
  const { data: events } = useIncidentEvents(incidentId);

  if (isLoading || !incident) return <Skeleton className="h-[300px] w-full" />;

  const sla = incidentSla(incident);

  return (
    <Card className="p-5">
      <Badge className="self-start" variant={incident.tier === 1 ? 'brand' : 'neutral'}>
        Tier {incident.tier}
      </Badge>
      <Text className="mt-3 font-semibold">{incident.subject}</Text>
      <HStack className="mt-2 gap-2 items-center flex-wrap">
        <Badge variant={incident.status === 'resolved' ? 'neutral' : 'dark'}>
          {STATUS_LABEL[incident.status]}
        </Badge>
        <Badge variant={slaVariant(sla.state)}>{sla.label}</Badge>
      </HStack>

      <View className="mt-3 rounded-xl bg-surface-alt px-3 py-3">
        <Text variant="small">{incident.detail}</Text>
      </View>

      <Divider className="my-4" />
      <Text className="font-semibold">Updates</Text>
      <VStack className="mt-2 gap-3">
        {(events ?? []).map((ev) => (
          <HStack key={ev.id} className="gap-3 items-start">
            <View className="mt-1.5 h-2 w-2 rounded-full bg-brand-500" />
            <VStack className="flex-1 gap-0.5">
              <Text variant="small" className="font-medium">
                {ev.body}
              </Text>
              <Text variant="small" className="text-ink-soft">
                {ev.actor} · {ev.created_at.slice(0, 16).replace('T', ' ')}
              </Text>
            </VStack>
          </HStack>
        ))}
        {(events ?? []).length === 0 ? (
          <Text variant="small" className="text-ink-soft">
            We've received your request and will update you here.
          </Text>
        ) : null}
      </VStack>
    </Card>
  );
}
