import { useState } from 'react';
import { View } from 'react-native';
import { DEMO_HOST_ID, useHostInboxThread } from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  HStack,
  Input,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { HostShell } from './shell';

export function HostInboxThreadScreen({
  threadId,
  hostId = DEMO_HOST_ID,
}: {
  threadId: string;
  hostId?: string;
}) {
  const { data, isLoading } = useHostInboxThread(hostId, threadId);
  const router = useRouter();
  const [draft, setDraft] = useState('');

  if (isLoading) {
    return (
      <HostShell title="Thread" subtitle="Loading…">
        <Skeleton className="mt-6 h-96 w-full" />
      </HostShell>
    );
  }
  if (!data) {
    return (
      <HostShell title="Thread not found" subtitle="Maybe it was archived.">
        <Card className="mt-6 p-6">
          <Button variant="secondary" onPress={() => router.push('/host/inbox')}>
            Back to inbox
          </Button>
        </Card>
      </HostShell>
    );
  }

  return (
    <HostShell
      title={data.guest_name}
      subtitle={`${data.listing_title} · ${data.start_date} → ${data.end_date} · ${data.guests} guests`}
    >
      <View className="mt-6 flex-col md:flex-row gap-6">
        <View className="flex-1">
          <Card className="p-5">
            <VStack className="gap-3">
              {data.messages.map((m) => (
                <HStack
                  key={m.id}
                  className={`gap-3 items-start ${m.from === 'host' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar
                    name={m.from === 'host' ? 'Mira Host' : data.guest_name}
                    src={m.from === 'host' ? undefined : data.guest_avatar}
                    size={32}
                  />
                  <View
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      m.from === 'host' ? 'bg-ink' : 'bg-surface-alt'
                    }`}
                  >
                    <Text className={m.from === 'host' ? 'text-white' : 'text-ink'}>
                      {m.body}
                    </Text>
                    <Text
                      variant="caption"
                      className={`mt-1 ${m.from === 'host' ? 'text-white/70' : 'text-ink-soft'}`}
                    >
                      {m.at}
                    </Text>
                  </View>
                </HStack>
              ))}
            </VStack>
          </Card>

          <Card className="mt-4 p-5">
            <Input
              label="Reply"
              placeholder="Write a message…"
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <HStack className="mt-3 justify-between flex-wrap gap-2">
              <Pressable
                onPress={() => toast.info('Preview only — message templates would open here.')}
              >
                <Text variant="small" className="text-ink-soft underline">
                  Use a template
                </Text>
              </Pressable>
              <Button
                variant="secondary"
                disabled={draft.trim().length === 0}
                onPress={() => {
                  toast.success('Preview only — message not actually sent.');
                  setDraft('');
                }}
              >
                Send
              </Button>
            </HStack>
          </Card>
        </View>

        <View className="md:w-[320px]">
          <Card className="p-5">
            <Text className="font-semibold">Reservation</Text>
            <VStack className="mt-3 gap-1.5">
              <Row label="Check-in"  value={data.start_date} />
              <Row label="Check-out" value={data.end_date} />
              <Row label="Nights"    value={String(data.nights)} />
              <Row label="Guests"    value={String(data.guests)} />
            </VStack>
            <Button
              variant="outline"
              className="mt-4"
              onPress={() => router.push(`/host/bookings/${data.booking_id}`)}
            >
              Open booking
            </Button>
          </Card>

          <Card className="mt-4 p-5">
            <Text className="font-semibold">Guest</Text>
            <HStack className="mt-3 gap-3 items-center">
              <Avatar src={data.guest_avatar} name={data.guest_name} size={48} />
              <VStack className="flex-1 gap-0.5">
                <Text className="font-semibold">{data.guest_name}</Text>
                <Badge variant="neutral">verified</Badge>
              </VStack>
            </HStack>
          </Card>
        </View>
      </View>
    </HostShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between">
      <Text variant="small" className="text-ink-soft">{label}</Text>
      <Text variant="small">{value}</Text>
    </HStack>
  );
}
