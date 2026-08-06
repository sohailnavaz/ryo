'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSendMessage, useThread } from '@bnb/api';
import {
  Avatar,
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

// One conversation. Role-agnostic: whoever I am, I see the other participant's name and
// my own messages aligned right (aqua) vs theirs left (glass).

export function ThreadScreen({ threadId }: { threadId: string }) {
  const router = useRouter();
  const { data, isLoading } = useThread(threadId);
  const send = useSendMessage();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const messages = data?.messages ?? [];

  // Keep the latest message in view as new ones arrive.
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length]);

  async function onSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      await send.mutateAsync({ threadId, body });
    } catch {
      toast.error('Message failed to send.');
      setDraft(body);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-cream p-4 md:p-10">
        <Skeleton className="h-[70vh] w-full" />
      </View>
    );
  }

  if (!data?.thread) {
    return (
      <View className="flex-1 bg-cream items-center justify-center p-10">
        <Text className="font-semibold">Conversation not found</Text>
        <Button variant="outline" className="mt-4" onPress={() => router.push('/messages')}>
          Back to messages
        </Button>
      </View>
    );
  }

  const { thread } = data;

  return (
    <View className="flex-1 bg-cream">
      <View className="flex-1 md:mx-auto md:w-full md:max-w-[760px]">
        {/* Header */}
        <HStack className="items-center gap-3 px-4 md:px-6 py-4 border-b border-surface-border">
          <Pressable onPress={() => router.push('/messages')}>
            <Text className="text-ink-soft">‹ Back</Text>
          </Pressable>
          <Avatar name={thread.other_name} size={36} src={thread.other_avatar ?? undefined} />
          <VStack className="flex-1">
            <Text className="font-semibold" numberOfLines={1}>
              {thread.other_name}
            </Text>
            {thread.subject ? (
              <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
                {thread.subject}
              </Text>
            ) : null}
          </VStack>
        </HStack>

        {/* Conversation */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4 md:px-6"
          contentContainerStyle={{ paddingVertical: 20, gap: 10 }}
        >
          {messages.length === 0 ? (
            <Card className="p-6 items-center">
              <Text variant="small" className="text-ink-soft">
                No messages yet — say hello.
              </Text>
            </Card>
          ) : (
            messages.map((m) => (
              <View key={m.id} className={m.mine ? 'items-end' : 'items-start'}>
                <View
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 ${
                    m.mine ? 'bg-brand-500 rounded-br-md' : 'bg-surface-alt rounded-bl-md'
                  }`}
                >
                  <Text className={m.mine ? 'text-cream' : 'text-ink'}>{m.body}</Text>
                </View>
                <Text variant="caption" className="text-ink-muted mt-1 px-1">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Composer */}
        <HStack className="items-end gap-2 px-4 md:px-6 py-3 border-t border-surface-border">
          <View className="flex-1">
            <Input
              placeholder={`Message ${thread.other_name}…`}
              value={draft}
              onChangeText={setDraft}
              multiline
              onSubmitEditing={onSend}
            />
          </View>
          <Button title="Send" onPress={onSend} loading={send.isPending} disabled={!draft.trim()} />
        </HStack>
      </View>
    </View>
  );
}
