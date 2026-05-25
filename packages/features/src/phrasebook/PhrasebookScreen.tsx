import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Heading, HStack, Pressable, Text, VStack } from '@bnb/ui';
import { PHRASEBOOK, type Language } from './data';

const FIRST: Language = PHRASEBOOK[0]!;

export function PhrasebookScreen() {
  const [activeCode, setActiveCode] = useState(FIRST.code);
  const active: Language = PHRASEBOOK.find((l) => l.code === activeCode) ?? FIRST;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 96 }}>
      <View className="w-full max-w-[900px] mx-auto px-4 md:px-8">
        {/* Hero */}
        <View className="pt-8 pb-2 md:pt-14 md:pb-4">
          <Text variant="small" className="text-brand-500 font-semibold uppercase tracking-wider">
            Ryo Phrasebook
          </Text>
          <Heading level={1} className="mt-2 max-w-[640px] md:text-[48px]">
            A few words go a long way.
          </Heading>
          <Text className="mt-3 max-w-[560px] text-ink-soft md:text-[17px] md:leading-[26px]">
            Essential phrases to greet, ask, eat, and get help — read aloud with the simple
            pronunciation hints.
          </Text>
          <HStack className="mt-4 items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-brand-500" />
            <Text variant="small" className="text-ink-soft">
              Works offline — every phrase is saved with the app, no connection needed.
            </Text>
          </HStack>
        </View>

        {/* Language picker */}
        <View className="mt-6">
          <View className="flex-row flex-wrap gap-2">
            {PHRASEBOOK.map((lang) => {
              const selected = lang.code === activeCode;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => setActiveCode(lang.code)}
                  className={
                    selected
                      ? 'flex-row items-center gap-2 rounded-full border border-ink bg-ink px-4 py-2.5'
                      : 'flex-row items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-2.5 hover:border-ink'
                  }
                >
                  <Text className={selected ? 'text-[15px]' : 'text-[15px]'}>{lang.flag}</Text>
                  <Text
                    className={
                      selected
                        ? 'text-[14px] font-semibold text-white'
                        : 'text-[14px] font-semibold text-ink'
                    }
                  >
                    {lang.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mt-3 text-ink-soft">
            <Text className="font-display text-[18px] font-semibold text-ink">
              {active.nativeName}
            </Text>
            {'  ·  '}
            <Text variant="small" className="text-ink-soft">{active.region}</Text>
          </Text>
        </View>

        {/* Category sections */}
        {active.categories.map((section) => (
          <View key={`${active.code}-${section.category}`} className="mt-9 md:mt-11">
            <Heading level={2} className="text-[22px] md:text-[26px]">
              {section.category}
            </Heading>
            <VStack className="mt-4 gap-3">
              {section.phrases.map((phrase) => (
                <Card
                  key={`${active.code}-${phrase.english}`}
                  className="flex-row flex-wrap items-center justify-between gap-3 p-4 md:p-5"
                >
                  <View className="min-w-[140px] flex-1">
                    <Text variant="small" className="text-ink-muted">
                      {phrase.english}
                    </Text>
                  </View>
                  <View className="min-w-[180px] flex-1 items-end">
                    <Text className="text-right font-display text-[18px] font-semibold leading-[24px] text-ink">
                      {phrase.translation}
                    </Text>
                    <Text variant="small" className="mt-0.5 text-right text-brand-500">
                      {phrase.pronunciation}
                    </Text>
                  </View>
                </Card>
              ))}
            </VStack>
          </View>
        ))}

        {/* Footer note */}
        <View className="mt-12 rounded-2xl border border-surface-border bg-surface-alt p-5">
          <Text variant="small" className="text-ink-soft">
            A small starter set, curated for travel. Pronunciation hints are approximate — say them
            warmly and locals will meet you halfway.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
