import { View } from 'react-native';
import { Card, Heading, HStack, Text, VStack } from '@bnb/ui';
import { HostShell } from './shell';

export function HostInsightsScreen() {
  return (
    <HostShell
      title="Insights"
      subtitle="Views, conversion, search rank, photo heatmap."
    >
      <View className="mt-6">
        <Card className="p-8">
          <VStack className="gap-3">
            <Heading level={3}>Coming in v3</Heading>
            <Text className="text-ink-soft">
              Insights ships after the core host loop is live in production. Once you have a few
              dozen bookings, the data here will tell you exactly which photos earn the most clicks,
              where you rank in neighbourhood search, and how your conversion compares to peers.
            </Text>
            <Text variant="small" className="text-ink-soft mt-1">
              Quiet, valuable signal — no nagging dashboards.
            </Text>
            <HStack className="mt-3 gap-3 flex-wrap">
              <Pill>Per-listing views</Pill>
              <Pill>Photo heatmap</Pill>
              <Pill>Neighbourhood rank</Pill>
              <Pill>Conversion benchmark</Pill>
            </HStack>
          </VStack>
        </Card>
      </View>
    </HostShell>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-full bg-surface-alt px-3 py-1">
      <Text variant="small">{children}</Text>
    </View>
  );
}
