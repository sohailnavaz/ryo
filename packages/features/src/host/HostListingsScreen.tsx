import { View } from 'react-native';
import { DEMO_HOST_ID, tryGetSupabase, useHostListings, useMyListings } from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  HStack,
  Image,
  Pressable,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatPrice } from '@bnb/utils';
import { HostShell } from './shell';

export function HostListingsScreen({ hostId = DEMO_HOST_ID }: { hostId?: string }) {
  const router = useRouter();
  // When signed in against a real Supabase project, show the host's OWN listings
  // (real, persisted). Otherwise fall back to the synthetic preview set.
  const signedInReal = tryGetSupabase() !== null;
  const real = useMyListings();
  const synthetic = useHostListings(hostId);
  const data = signedInReal ? real.data : synthetic.data;
  const isLoading = signedInReal ? real.isLoading : synthetic.isLoading;

  return (
    <HostShell
      title="Your listings"
      subtitle="Edit photos, pricing, rules. Major edits re-enter moderation."
    >
      <View className="mt-6 flex-row justify-end">
        <Button variant="secondary" onPress={() => router.push('/host/listings/new')}>
          + New listing
        </Button>
      </View>

      <View className="mt-4 flex-col gap-4">
        {isLoading || !data ? (
          <Skeleton className="h-96 w-full" />
        ) : data.length === 0 ? (
          <Card className="p-8 items-center gap-3">
            <Text className="text-ink-soft">No listings yet.</Text>
            <Button title="Create your first listing" onPress={() => router.push('/host/listings/new')} />
          </Card>
        ) : (
          data.map((l) => {
            const photo = (l.photos ?? []).sort((a, b) => a.position - b.position)[0]?.url;
            return (
              <Pressable
                key={l.id}
                onPress={() => router.push(`/host/listings/${l.id}/edit`)}
              >
                <Card className="overflow-hidden p-0 md:flex-row">
                  <View className="md:w-[200px] aspect-video md:aspect-square bg-surface-alt">
                    {photo ? (
                      <Image uri={photo} style={{ width: '100%', height: '100%' }} />
                    ) : null}
                  </View>
                  <VStack className="flex-1 p-4 gap-2">
                    <HStack className="justify-between gap-3">
                      <VStack className="flex-1 gap-0.5">
                        <Text className="font-semibold" numberOfLines={1}>
                          {l.title}
                        </Text>
                        <Text variant="small" className="text-ink-soft">
                          {l.city}, {l.country} · {l.property_type}
                        </Text>
                      </VStack>
                      <Badge variant="neutral">published</Badge>
                    </HStack>
                    <Text variant="small" className="text-ink-soft" numberOfLines={2}>
                      {l.description}
                    </Text>
                    <HStack className="mt-2 justify-between gap-3">
                      <HStack className="gap-3 flex-wrap">
                        <Pill>★ {l.rating_avg.toFixed(2)} ({l.rating_count})</Pill>
                        <Pill>{l.bedrooms} bed</Pill>
                        <Pill>up to {l.max_guests}</Pill>
                      </HStack>
                      <Text className="font-semibold">
                        {formatPrice(l.price_cents, l.currency)} / night
                      </Text>
                    </HStack>
                  </VStack>
                </Card>
              </Pressable>
            );
          })
        )}
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
