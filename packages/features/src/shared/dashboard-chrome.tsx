import { View } from 'react-native';
import { Heading, HStack, Text, VStack } from '@bnb/ui';

export type DashboardKind = 'host' | 'admin' | 'guest';

const KIND_COPY: Record<DashboardKind, { title: string; body: string }> = {
  host: {
    title: 'Host dashboard preview',
    body:
      'Not production. Bookings, earnings and reviews on this page are synthesised for layout review. Real data wires up when v2 ships.',
  },
  admin: {
    title: 'Partly live',
    // This banner used to claim users, the audit log and moderation were synthetic.
    // After Phases 0–3 that is no longer true, and a banner that lies about which
    // buttons are real is worse than no banner: it teaches an operator to distrust
    // the console exactly where it has become trustworthy. Say precisely what is
    // still fake, and nothing more.
    body:
      'Users, moderation, incidents, bookings, flags, the audit log and finance are LIVE — actions here really happen and are recorded. Overview and System health are still synthesised.',
  },
  guest: {
    title: 'Account preview',
    body:
      'Showing demo content because you’re not signed in. Sign in to see your real trips, favourites and recent activity.',
  },
};

export function PreviewBanner({ kind }: { kind: DashboardKind }) {
  const { title, body } = KIND_COPY[kind];
  return (
    <View className="mt-2 rounded-2xl border border-surface-border bg-surface-alt px-4 py-3">
      <HStack className="items-start gap-3">
        <View className="h-8 w-8 rounded-full bg-ink items-center justify-center">
          <Text className="text-white font-bold">v2</Text>
        </View>
        <VStack className="flex-1 gap-0.5">
          <Text className="font-semibold">{title}</Text>
          <Text variant="small" className="text-ink-soft">
            {body}
          </Text>
        </VStack>
      </HStack>
    </View>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <VStack className="mt-10 gap-1">
      <Heading level={2}>{title}</Heading>
      {subtitle ? (
        <Text variant="small" className="text-ink-soft">
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}
