// Ryo AI Concierge — guest chat screen.
//
// Built strictly from @bnb/ui primitives plus the react-native layout allowlist
// (View, ScrollView). No next/* imports — this is the shared features layer.
// Multilingual-ready: detects the guest's locale from their profile and lets
// them pick a reply language; the chosen locale is forwarded to the concierge.

import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Heading,
  HStack,
  Input,
  Pressable,
  Sparkles,
  Text,
  VStack,
} from '@bnb/ui';
import { useSession } from '@bnb/api';
import { useConcierge } from './useConcierge';

export type ConciergeScreenProps = {
  /** Override the concierge endpoint (native passes an absolute URL). */
  endpoint?: string;
};

// Launch locales (docs/12 §5). Reply language the guest can pick explicitly.
const LOCALES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'ja', label: '日本語' },
];

const SUGGESTIONS = [
  'Find me a beachfront stay for 4 under $300/night',
  'What’s the wifi like at a listing I’m considering?',
  'I need a pet-friendly cabin in the mountains',
];

const TOOL_LABELS: Record<string, string> = {
  answer_from_listing: 'Checking the listing…',
  recommend: 'Finding stays…',
  message_host: 'Reaching the host…',
  create_incident: 'Opening a support case…',
};

export function ConciergeScreen({ endpoint }: ConciergeScreenProps) {
  const { user } = useSession();
  const profileLocale =
    (user?.user_metadata as { locale?: string } | undefined)?.locale ?? 'en';
  const [locale, setLocale] = useState(profileLocale);
  useEffect(() => setLocale(profileLocale), [profileLocale]);

  const greeting =
    "Hi, I’m your Ryo concierge. Ask me about a stay, tell me what you’re looking for, or let me know if something’s gone wrong — I’ll take it from here.";

  const { messages, send, isStreaming, toolActivity, error } = useConcierge({
    endpoint,
    locale,
    userId: user?.id ?? null,
    greeting,
  });

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages, toolActivity]);

  const submit = (text?: string) => {
    const value = (text ?? draft).trim();
    if (!value || isStreaming) return;
    setDraft('');
    void send(value);
  };

  return (
    <View className="flex-1 bg-surface-alt">
      <View className="flex-1 w-full max-w-[760px] self-center px-4 md:px-6">
        {/* Header */}
        <HStack className="justify-between py-4">
          <HStack className="gap-3">
            <View className="h-10 w-10 rounded-full bg-brand-100 items-center justify-center">
              <Sparkles size={20} color="#C87156" />
            </View>
            <VStack>
              <Heading level={3}>Concierge</Heading>
              <Text variant="caption">24/7 · in your language</Text>
            </VStack>
          </HStack>
        </HStack>

        {/* Language picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-none mb-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <Pressable
                key={l.code}
                onPress={() => setLocale(l.code)}
                className={`px-3 py-1.5 rounded-full border ${
                  active ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
                }`}
              >
                <Text className={active ? 'text-white text-[13px]' : 'text-ink text-[13px]'}>
                  {l.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Conversation */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} pending={m.pending} />
          ))}

          {toolActivity ? (
            <HStack className="gap-2 pl-1">
              <Text variant="caption">{TOOL_LABELS[toolActivity] ?? 'Working…'}</Text>
            </HStack>
          ) : null}

          {error ? (
            <Card className="bg-brand-50 border-brand-200 p-3">
              <Text variant="small" className="text-brand-700">
                {error}
              </Text>
            </Card>
          ) : null}

          {/* Suggestions on first load */}
          {messages.length <= 1 ? (
            <VStack className="gap-2 mt-2">
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => submit(s)}
                  className="rounded-2xl border border-surface-border bg-surface px-4 py-3 active:bg-surface-alt"
                >
                  <Text variant="small">{s}</Text>
                </Pressable>
              ))}
            </VStack>
          ) : null}
        </ScrollView>

        {/* Composer */}
        <View className="py-3">
          <HStack className="gap-2 items-end">
            <View className="flex-1">
              <Input
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask the concierge…"
                multiline
                onSubmitEditing={() => submit()}
                blurOnSubmit
                returnKeyType="send"
                editable={!isStreaming}
              />
            </View>
            <Button
              title="Send"
              onPress={() => submit()}
              loading={isStreaming}
              disabled={!draft.trim()}
            />
          </HStack>
          <Text variant="caption" className="mt-1.5 text-center">
            Real listings are live. Payments are still in demo mode.
          </Text>
        </View>
      </View>
    </View>
  );
}

function MessageBubble({
  role,
  content,
  pending,
}: {
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}) {
  const isUser = role === 'user';
  if (isUser) {
    return (
      <View className="self-end max-w-[85%]">
        <View className="rounded-2xl rounded-br-md bg-ink px-4 py-2.5">
          <Text className="text-white">{content}</Text>
        </View>
      </View>
    );
  }
  return (
    <HStack className="gap-2 items-start self-start max-w-[90%]">
      <Avatar name="Ryo" size={28} className="mt-0.5" />
      <View className="rounded-2xl rounded-bl-md bg-surface border border-surface-border px-4 py-2.5">
        {content ? (
          <Text>{content}</Text>
        ) : pending ? (
          <Text variant="caption">…</Text>
        ) : null}
      </View>
    </HStack>
  );
}
