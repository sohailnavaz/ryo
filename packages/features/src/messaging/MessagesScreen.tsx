'use client';

import { View } from 'react-native';
import { useThreads, type MessageThread } from '@bnb/api';
import { Avatar, Badge, Card, Heading, HStack, Pressable, Skeleton, Text, VStack } from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

// The inbox — one surface for both sides. RLS returns threads where I'm the guest OR
// the host, so there is no role branching here: a host and a guest see the same screen,
// each looking at the other participant.

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function MessagesScreen() {
  const router = useRouter();
  const { data: threads, isLoading } = useThreads();

  return (
    <View className="flex-1 bg-cream">
      <View className="px-4 pt-6 md:px-10 md:mx-auto md:w-full md:max-w-[820px]">
        <Heading level={1}>Messages</Heading>
        <Text className="text-ink-soft mt-1">Your conversations with hosts and guests.</Text>

        <View className="mt-6">
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : !threads || threads.length === 0 ? (
            <Card className="p-10 items-center">
              <Text className="font-semibold">No messages yet</Text>
              <Text variant="small" className="text-ink-soft mt-1 text-center">
                Message a host from any listing and the conversation shows up here.
              </Text>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              {threads.map((t, i) => (
                <ThreadRow
                  key={t.id}
                  t={t}
                  last={i === threads.length - 1}
                  onPress={() => router.push(`/messages/${t.id}`)}
                />
              ))}
            </Card>
          )}
        </View>
      </View>
    </View>
  );
}

function ThreadRow({ t, last, onPress }: { t: MessageThread; last: boolean; onPress: () => void }) {
  const unread = t.my_unread > 0;
  return (
    <Pressable onPress={onPress}>
      <View
        className={`flex-row items-center gap-3 px-5 py-4 ${
          last ? '' : 'border-b border-surface-border'
        } ${unread ? 'bg-brand-50' : ''}`}
      >
        <Avatar name={t.other_name} size={44} src={t.other_avatar ?? undefined} />
        <VStack className="flex-1 gap-0.5">
          <HStack className="items-center gap-2">
            <Text className="font-semibold" numberOfLines={1}>
              {t.other_name}
            </Text>
            {t.subject ? (
              <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
                · {t.subject}
              </Text>
            ) : null}
          </HStack>
          <Text variant="small" className={unread ? 'text-ink' : 'text-ink-soft'} numberOfLines={1}>
            {t.last_body ?? 'No messages yet'}
          </Text>
        </VStack>
        <VStack className="items-end gap-1">
          <Text variant="caption" className="text-ink-soft">
            {timeAgo(t.last_message_at)}
          </Text>
          {unread ? <Badge variant="brand">{t.my_unread}</Badge> : null}
        </VStack>
      </View>
    </Pressable>
  );
}
