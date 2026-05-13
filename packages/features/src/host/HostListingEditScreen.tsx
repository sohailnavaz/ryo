import { View } from 'react-native';
import { DEMO_HOST_ID, useHostListing } from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Image,
  Input,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { formatPrice } from '@bnb/utils';
import { HostShell } from './shell';

export function HostListingEditScreen({
  listingId,
  hostId = DEMO_HOST_ID,
}: {
  listingId: string;
  hostId?: string;
}) {
  const { data, isLoading } = useHostListing(hostId, listingId);
  const router = useRouter();

  if (isLoading) {
    return (
      <HostShell title="Listing editor" subtitle="Loading…">
        <Skeleton className="mt-6 h-96 w-full" />
      </HostShell>
    );
  }

  if (!data) {
    return (
      <HostShell title="Listing not found" subtitle="Check the URL or go back.">
        <Card className="mt-6 p-6">
          <Button variant="secondary" onPress={() => router.push('/host/listings')}>
            Back to listings
          </Button>
        </Card>
      </HostShell>
    );
  }

  const { listing: l, bookings, reviews } = data;
  const photos = (l.photos ?? []).slice().sort((a, b) => a.position - b.position);
  const stub = () => toast.info('Preview only — save would write through to the listing record.');

  return (
    <HostShell
      title={l.title}
      subtitle={`${l.city}, ${l.country} · ${l.property_type}`}
    >
      <HStack className="mt-2 gap-2 flex-wrap">
        <Badge variant="neutral">published</Badge>
        <Badge variant="neutral">{bookings.length} all-time bookings</Badge>
        <Badge variant="neutral">{reviews.length} reviews</Badge>
      </HStack>

      <View className="mt-6 flex-col md:flex-row gap-6">
        <View className="flex-1 gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Photos</Text>
            <View className="mt-3 flex-row flex-wrap gap-3">
              {photos.map((p) => (
                <View
                  key={p.id}
                  className="w-full md:w-[calc(33%-8px)] aspect-square overflow-hidden rounded-xl bg-surface-alt"
                >
                  <Image uri={p.url} style={{ width: '100%', height: '100%' }} />
                </View>
              ))}
            </View>
            <Button variant="outline" className="mt-3" onPress={stub}>
              Replace cover photo
            </Button>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Basics</Text>
            <VStack className="mt-3 gap-3">
              <Field label="Title" value={l.title} />
              <Field label="Description" value={l.description} multiline />
              <HStack className="gap-3">
                <View className="flex-1">
                  <Field label="Bedrooms"   value={String(l.bedrooms)} />
                </View>
                <View className="flex-1">
                  <Field label="Bathrooms"  value={String(l.bathrooms)} />
                </View>
                <View className="flex-1">
                  <Field label="Max guests" value={String(l.max_guests)} />
                </View>
              </HStack>
            </VStack>
            <Button variant="secondary" className="mt-4" onPress={stub}>
              Save changes
            </Button>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Amenities</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {l.amenities.map((a) => (
                <View key={a} className="rounded-full bg-surface-alt px-3 py-1">
                  <Text variant="small">{a}</Text>
                </View>
              ))}
            </View>
            <Button variant="outline" className="mt-4" onPress={stub}>
              Edit amenities
            </Button>
          </Card>
        </View>

        <View className="md:w-[360px] gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Pricing</Text>
            <View className="mt-3">
              <Row label="Base nightly"   value={formatPrice(l.price_cents, l.currency)} />
              <Row label="Weekend uplift" value="+ 12%" />
              <Row label="Min stay"       value="2 nights" />
              <Divider className="my-2" />
              <Row label="Cleaning fee"   value={formatPrice(Math.round(l.price_cents * 0.08), l.currency)} />
              <Row label="Service fee"    value="3% guest + 12% host" />
            </View>
            <Button variant="outline" className="mt-4" onPress={stub}>
              Open pricing rules
            </Button>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">House rules</Text>
            <VStack className="mt-3 gap-1.5">
              <Rule>No parties</Rule>
              <Rule>No smoking indoors</Rule>
              <Rule>Pets considered case-by-case</Rule>
              <Rule>Quiet hours 22:00 – 08:00</Rule>
            </VStack>
            <Button variant="outline" className="mt-4" onPress={stub}>
              Edit rules
            </Button>
          </Card>
        </View>
      </View>

      <View className="mt-8">
        <Pressable onPress={() => router.push('/host/listings')}>
          <Text className="text-ink-soft underline">← Back to all listings</Text>
        </Pressable>
      </View>
    </HostShell>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <VStack className="gap-1">
      <Text variant="label">{label}</Text>
      <Input value={value} multiline={multiline} editable={false} />
    </VStack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between py-1">
      <Text variant="small" className="text-ink-soft">{label}</Text>
      <Text>{value}</Text>
    </HStack>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <HStack className="gap-2 items-start">
      <View className="h-1.5 w-1.5 rounded-full bg-ink mt-2" />
      <Text className="flex-1">{children}</Text>
    </HStack>
  );
}
