import { useRef } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Heading,
  HStack,
  MapPin,
  Pressable,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import {
  CITY_GUIDES,
  CITY_INFO,
  COLLECTIONS,
  PLAN_BLOCKS,
  SEASONAL_PICKS,
  TRAVELER_STORIES,
} from './data';

const MONTH = new Date().toLocaleString('en-US', { month: 'long' });
const COVER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1800&q=75&auto=format&fit=crop';

export function StoriesScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const coverH = Math.max(520, Math.min(height * 0.82, 820));

  return (
    <ScrollView ref={scrollRef} className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 96 }}>
      {/* Immersive intro cover — describes the page, then "Continue" into the feed */}
      <View className="relative w-full overflow-hidden bg-ink" style={{ height: coverH }}>
        <Image source={{ uri: COVER }} className="absolute inset-0 h-full w-full" resizeMode="cover" />
        {/* gradient-ish scrim for legible type */}
        <View className="absolute inset-0" style={{ backgroundColor: 'rgba(14,26,43,0.52)' }} />
        <View className="absolute inset-x-0 bottom-0 h-1/2" style={{ backgroundColor: 'rgba(14,26,43,0.35)' }} />

        <View className="flex-1 justify-center px-6 md:px-16">
          <View className="max-w-[820px]">
            <Text className="text-white/80 font-semibold uppercase tracking-[3px]">Ryo Stories</Text>
            <Heading level={1} className="mt-3 text-white md:text-[68px] md:leading-[1.02]">
              The world, told by the people in it.
            </Heading>
            <Text className="mt-4 max-w-[560px] text-white/85 md:text-[18px] md:leading-[28px]">
              Real trips, local guides, and where to go right now — every story pinned to a place,
              with what it’s famous for. Scroll in.
            </Text>
            <View className="mt-7 flex-row">
              <Button
                title="Continue  ↓"
                onPress={() => scrollRef.current?.scrollTo({ y: coverH - 8, animated: true })}
              />
            </View>
          </View>
        </View>
      </View>

      <View className="w-full max-w-[1280px] mx-auto px-4 md:px-10">
        {/* Good right now */}
        <Section title={`Good right now · ${MONTH}`} subtitle="Places at their best this time of year">
          <View className="flex-row flex-wrap gap-5">
            {SEASONAL_PICKS.map((p) => (
              <Pressable
                key={p.city}
                onPress={() => router.push('/discover')}
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
                <Text variant="small" className="mt-2 text-ink-soft leading-[19px]">{p.whyNow}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Traveler stories — geo-tagged with "known for" */}
        <Section title="Traveler stories" subtitle="Every post pinned to a place — tap to see what it's known for">
          <View className="flex-row flex-wrap gap-5">
            {TRAVELER_STORIES.map((s) => {
              const info = CITY_INFO[s.city];
              return (
                <Pressable
                  key={s.id}
                  onPress={() => router.push('/discover')}
                  className="group min-w-[300px] flex-1 transition duration-200 hover:-translate-y-1"
                >
                  <Card className="overflow-hidden p-0">
                    <View className="aspect-[16/10] w-full overflow-hidden bg-surface-alt">
                      <Image
                        source={{ uri: s.img }}
                        className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                        resizeMode="cover"
                      />
                      {/* location chip */}
                      <View className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1">
                        <MapPin size={12} color="#C87156" />
                        <Text variant="caption" className="font-semibold text-ink">{s.city}</Text>
                      </View>
                    </View>
                    <View className="p-4">
                      <HStack className="items-center gap-2">
                        <Avatar src={s.avatar} name={s.author} size={28} />
                        <Text variant="small" className="font-semibold">{s.author}</Text>
                        <Text variant="caption" className="ml-auto text-ink-muted">♥ {s.saves}</Text>
                      </HStack>
                      <Text className="mt-2 font-display text-[18px] font-semibold leading-[23px]">{s.title}</Text>
                      <Text variant="small" className="mt-1 text-ink-soft leading-[19px]">{s.snippet}</Text>
                      {info ? (
                        <View className="mt-3 rounded-xl bg-surface-alt p-3">
                          <Text variant="caption" className="font-semibold uppercase tracking-wider text-brand-600">
                            Known for
                          </Text>
                          <Text variant="small" className="mt-0.5 text-ink leading-[18px]">{info.knownFor}</Text>
                          <Text variant="caption" className="mt-1 text-ink-soft">Best time · {info.bestTime}</Text>
                        </View>
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* City guides */}
        <Section title="City guides" subtitle="Local-led, save-worthy">
          <View className="flex-row flex-wrap gap-5">
            {CITY_GUIDES.map((g) => (
              <Pressable
                key={g.slug}
                onPress={() => router.push('/discover')}
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
                <Text className="mt-1.5 font-display text-[18px] font-semibold leading-[23px]">{g.title}</Text>
                <Text variant="caption" className="mt-0.5 text-ink-soft">{g.author} · {g.readMin} min read</Text>
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
    <View className="mt-12 md:mt-16">
      <Heading level={2}>{title}</Heading>
      {subtitle ? <Text className="mt-1 text-ink-soft">{subtitle}</Text> : null}
      <View className="mt-5">{children}</View>
    </View>
  );
}
