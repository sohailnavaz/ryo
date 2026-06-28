import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Heading, HStack, Input, Pressable, Text, VStack } from '@bnb/ui';
import { FAQ_CATEGORIES, searchFaq, type FaqCategory } from './faq-data';

export function FaqScreen() {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(FAQ_CATEGORIES[0]!.id);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const q = query.trim();
  const hits = useMemo(() => (q.length > 0 ? searchFaq(q) : []), [q]);
  const active: FaqCategory =
    FAQ_CATEGORIES.find((c) => c.id === activeId) ?? FAQ_CATEGORIES[0]!;

  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 96 }}>
      <View className="w-full max-w-[900px] mx-auto px-4 md:px-8">
        {/* Hero */}
        <View className="pt-8 pb-2 md:pt-14 md:pb-4">
          <Text variant="small" className="text-brand-700 font-semibold uppercase tracking-wider">
            Help center
          </Text>
          <Heading level={1} className="mt-2 max-w-[640px] md:text-[48px]">
            How can we help?
          </Heading>
          <Text className="mt-3 max-w-[560px] text-ink-soft md:text-[17px] md:leading-[26px]">
            Answers to common questions about booking, payments, your stay, and hosting. Still
            stuck? The Concierge is here 24/7.
          </Text>
          <View className="mt-5">
            <Input
              placeholder="Search help articles…"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        {/* Search results */}
        {q.length > 0 ? (
          <View className="mt-4">
            <Text variant="small" className="text-ink-muted">
              {hits.length} {hits.length === 1 ? 'result' : 'results'} for “{q}”
            </Text>
            <VStack className="mt-3 gap-3">
              {hits.map((hit, i) => (
                <Card key={`hit-${i}`} className="p-4 md:p-5">
                  <Text variant="small" className="text-brand-700">
                    {hit.category}
                  </Text>
                  <Text className="mt-1 font-display text-[17px] font-semibold text-ink">
                    {hit.q}
                  </Text>
                  <Text className="mt-1.5 text-ink-soft leading-[22px]">{hit.a}</Text>
                </Card>
              ))}
              {hits.length === 0 ? (
                <Card className="p-5">
                  <Text className="text-ink-soft">
                    No results. Try different words, or ask the Concierge for a direct answer.
                  </Text>
                </Card>
              ) : null}
            </VStack>
          </View>
        ) : (
          <>
            {/* Category picker */}
            <View className="mt-6">
              <View className="flex-row flex-wrap gap-2">
                {FAQ_CATEGORIES.map((cat) => {
                  const selected = cat.id === activeId;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setActiveId(cat.id)}
                      className={
                        selected
                          ? 'flex-row items-center gap-2 rounded-full border border-ink bg-ink px-4 py-2.5'
                          : 'flex-row items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-2.5 hover:border-ink'
                      }
                    >
                      <Text className="text-[15px]">{cat.icon}</Text>
                      <Text
                        className={
                          selected
                            ? 'text-[14px] font-semibold text-white'
                            : 'text-[14px] font-semibold text-ink'
                        }
                      >
                        {cat.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <HStack className="mt-3 items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-brand-500" />
                <Text variant="small" className="text-ink-soft">
                  {active.blurb}
                </Text>
              </HStack>
            </View>

            {/* Q&A accordion */}
            <View className="mt-7">
              <Heading level={2} className="text-[22px] md:text-[26px]">
                {active.title}
              </Heading>
              <VStack className="mt-4 gap-3">
                {active.items.map((item, i) => {
                  const key = `${active.id}-${i}`;
                  const isOpen = !!open[key];
                  return (
                    <Pressable key={key} onPress={() => toggle(key)}>
                      <Card className="p-4 md:p-5">
                        <HStack className="items-start justify-between gap-3">
                          <Text className="flex-1 font-display text-[17px] font-semibold text-ink">
                            {item.q}
                          </Text>
                          <Text className="text-ink-muted text-[18px]">{isOpen ? '–' : '+'}</Text>
                        </HStack>
                        {isOpen ? (
                          <Text className="mt-2 text-ink-soft leading-[23px]">{item.a}</Text>
                        ) : null}
                      </Card>
                    </Pressable>
                  );
                })}
              </VStack>
            </View>
          </>
        )}

        {/* Still need help */}
        <View className="mt-12 rounded-2xl border border-surface-border bg-surface-alt p-5">
          <Text className="font-display text-[18px] font-semibold text-ink">
            Still need a hand?
          </Text>
          <Text variant="small" className="mt-1 text-ink-soft">
            Ask the Concierge for an instant answer, or open a support request and our team will
            follow up — every guest is hosted, not just accommodated.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
