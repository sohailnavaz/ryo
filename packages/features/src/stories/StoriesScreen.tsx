import { Image, ScrollView, View } from 'react-native';
import {
  Avatar,
  Badge,
  Card,
  Heading,
  HStack,
  Pressable,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import {
  CITY_GUIDES,
  COLLECTIONS,
  PLAN_BLOCKS,
  SEASONAL_PICKS,
  TRAVELER_STORIES,
} from './data';

const MONTH = new Date().toLocaleString('en-US', { month: 'long' });

export function StoriesScreen() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 96 }}>
      <View className="w-full max-w-[1280px] mx-auto px-4 md:px-10">
        {/* Hero */}
        <View className="pt-8 pb-2 md:pt-14 md:pb-4">
          <Text variant="small" className="text-brand-500 font-semibold uppercase tracking-wider">
            Ryo Stories
          </Text>
          <Heading level={1} className="mt-2 max-w-[760px] md:text-[52px]">
            Stories from the road.
          </Heading>
          <Text className="mt-3 max-w-[600px] text-ink-soft md:text-[17px] md:leading-[26px]">
            Where to go right now, guides worth saving, and trips told by travelers who’ve been.
          </Text>
        </View>

        {/* Good right now */}
        <Section title={`Good right now · ${MONTH}`} subtitle="Places at their best this time of year">
          <View className="flex-row flex-wrap gap-5">
            {SEASONAL_PICKS.map((p) => (
              <Pressable
                key={p.city}
                onPress={() => router.push('/')}
                className="group min-w-[240px] flex-1 transition duration-200 hover:-translate-y-1"
              >
                <View className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface-alt transition duration-200 group-hover:shadow-card">
                  <Image
                    source={{ uri: p.img }}
                    className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                    resizeMode="cover"
                  />
                  <View className="absolute left-3 top-3">
                    <Badge variant="brand">In season</Badge>
                  </View>
                  <View className="absolute inset-x-0 bottom-0 p-3" style={{ backgroundColor: 'rgba(14,26,43,0.45)' }}>
                    <Text className="text-white font-display text-[19px] font-semibold">{p.city}</Text>
                    <Text variant="caption" className="text-white/85">{p.country}</Text>
                  </View>
                </View>
                <Text variant="small" className="mt-2 text-ink-soft leading-[19px]">
                  {p.whyNow}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* City guides */}
        <Section title="City guides" subtitle="Local-led, save-worthy">
          <View className="flex-row flex-wrap gap-5">
            {CITY_GUIDES.map((g) => (
              <Pressable
                key={g.slug}
                onPress={() => router.push('/')}
                className="group min-w-[260px] flex-1 transition duration-200 hover:-translate-y-1"
              >
                <View className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface-alt transition duration-200 group-hover:shadow-card">
                  <Image
                    source={{ uri: g.img }}
                    className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                    resizeMode="cover"
                  />
                </View>
                <HStack className="mt-2 flex-wrap gap-1.5">
                  {g.tags.map((t) => (
                    <Badge key={t} variant="neutral">{t}</Badge>
                  ))}
                </HStack>
                <Text className="mt-1.5 font-display text-[18px] font-semibold leading-[23px]">
                  {g.title}
                </Text>
                <Text variant="caption" className="mt-0.5 text-ink-soft">
                  {g.author} · {g.readMin} min read
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Traveler stories */}
        <Section title="Traveler stories" subtitle="Trips, told by the people who took them">
          <View className="flex-row flex-wrap gap-5">
            {TRAVELER_STORIES.map((s) => (
              <Pressable
                key={s.id}
                className="group min-w-[280px] flex-1 transition duration-200 hover:-translate-y-1"
              >
                <Card className="overflow-hidden p-0">
                  <View className="aspect-[16/9] w-full overflow-hidden bg-surface-alt">
                    <Image
                      source={{ uri: s.img }}
                      className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="p-4">
                    <HStack className="items-center gap-2">
                      <Avatar src={s.avatar} name={s.author} size={28} />
                      <Text variant="small" className="font-semibold">{s.author}</Text>
                    </HStack>
                    <Text className="mt-2 font-display text-[17px] font-semibold leading-[22px]">
                      {s.title}
                    </Text>
                    <Text variant="small" className="mt-1 text-ink-soft leading-[19px]">
                      {s.snippet}
                    </Text>
                    <Text variant="caption" className="mt-3 text-ink-muted">♥ {s.saves} saves</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Plan your trip */}
        <Section title="Plan your trip" subtitle="The practical bits, sorted">
          <View className="flex-row flex-wrap gap-4">
            {PLAN_BLOCKS.map((b, i) => (
              <Card key={b.title} className="min-w-[220px] flex-1 p-5">
                <Text className="font-display text-brand-500 text-[22px] font-semibold">
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text className="mt-2 font-semibold">{b.title}</Text>
                <Text variant="small" className="mt-1 text-ink-soft leading-[19px]">{b.blurb}</Text>
              </Card>
            ))}
          </View>
        </Section>

        {/* Collections */}
        <Section title="Collections" subtitle="Hand-picked themes to browse">
          <View className="flex-row flex-wrap gap-5">
            {COLLECTIONS.map((c) => (
              <Pressable
                key={c.title}
                onPress={() => router.push('/')}
                className="group min-w-[240px] flex-1"
              >
                <View className="aspect-[3/2] w-full overflow-hidden rounded-2xl bg-surface-alt transition duration-200 group-hover:shadow-card">
                  <Image
                    source={{ uri: c.img }}
                    className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0" style={{ backgroundColor: 'rgba(14,26,43,0.35)' }} />
                  <View className="absolute inset-x-0 bottom-0 p-4">
                    <Text className="text-white font-display text-[20px] font-semibold">{c.title}</Text>
                    <Text variant="caption" className="text-white/85">{c.blurb} · {c.count} stays</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-10 md:mt-14">
      <Heading level={2}>{title}</Heading>
      {subtitle ? <Text className="mt-1 text-ink-soft">{subtitle}</Text> : null}
      <View className="mt-5">{children}</View>
    </View>
  );
}
