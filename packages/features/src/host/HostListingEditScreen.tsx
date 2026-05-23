import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  DEMO_HOST_ID,
  tryGetSupabase,
  useDeleteListing,
  useHostListing,
  useMyListings,
  useUpdateListing,
} from '@bnb/api';
import { AMENITIES } from '@bnb/db';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
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

const PROPERTY_TYPES = ['House', 'Apartment', 'Cabin', 'Villa', 'Treehouse', 'Cottage'];
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD'];

export function HostListingEditScreen({
  listingId,
  hostId = DEMO_HOST_ID,
}: {
  listingId: string;
  hostId?: string;
}) {
  const router = useRouter();
  // Signed in against a real Supabase project → edit the host's OWN persisted
  // listing. Otherwise show the synthetic preview (read-only).
  const signedInReal = tryGetSupabase() !== null;
  const myListings = useMyListings();
  const synthetic = useHostListing(hostId, listingId);

  if (signedInReal) {
    const listing = myListings.data?.find((l) => l.id === listingId);
    return (
      <RealEditor
        listing={listing}
        isLoading={myListings.isLoading}
        onBack={() => router.push('/host/listings')}
      />
    );
  }

  // --- synthetic read-only preview ---
  const data = synthetic.data;
  if (synthetic.isLoading) {
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
  return <SyntheticPreview data={data} onBack={() => router.push('/host/listings')} />;
}

// ---------------------------------------------------------------------------
// Real editor — writes through to Supabase via useUpdateListing / useDeleteListing.
// ---------------------------------------------------------------------------

type RealListing = NonNullable<ReturnType<typeof useMyListings>['data']>[number];

function RealEditor({
  listing,
  isLoading,
  onBack,
}: {
  listing: RealListing | undefined;
  isLoading: boolean;
  onBack: () => void;
}) {
  const update = useUpdateListing();
  const del = useDeleteListing();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form state, hydrated from the listing once it loads.
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('House');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [guests, setGuests] = useState('2');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title);
    setDescription(listing.description);
    setPropertyType(listing.property_type);
    setPrice(String(Math.round(listing.price_cents / 100)));
    setCurrency(listing.currency);
    setBedrooms(String(listing.bedrooms));
    setBathrooms(String(listing.bathrooms));
    setGuests(String(listing.max_guests));
    setCity(listing.city);
    setCountry(listing.country);
    setAmenities(listing.amenities ?? []);
  }, [listing]);

  if (isLoading) {
    return (
      <HostShell title="Listing editor" subtitle="Loading your listing…">
        <Skeleton className="mt-6 h-96 w-full" />
      </HostShell>
    );
  }
  if (!listing) {
    return (
      <HostShell title="Listing not found" subtitle="It may not exist, or it isn’t yours to edit.">
        <Card className="mt-6 p-6">
          <Button variant="secondary" onPress={onBack}>
            Back to listings
          </Button>
        </Card>
      </HostShell>
    );
  }

  const toInt = (s: string, d: number) => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n >= 0 ? n : d;
  };

  const save = () => {
    const priceMajor = parseFloat(price);
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!Number.isFinite(priceMajor) || priceMajor <= 0) {
      toast.error('Enter a valid nightly price.');
      return;
    }
    update.mutate(
      {
        id: listing.id,
        patch: {
          title: title.trim(),
          description: description.trim(),
          property_type: propertyType,
          price_cents: Math.round(priceMajor * 100),
          currency,
          bedrooms: toInt(bedrooms, listing.bedrooms),
          bathrooms: toInt(bathrooms, listing.bathrooms),
          max_guests: toInt(guests, listing.max_guests),
          city: city.trim(),
          country: country.trim(),
          amenities,
        },
      },
      {
        onSuccess: () => toast.success('Listing saved.', { description: 'Major edits re-enter moderation.' }),
        onError: (e) =>
          toast.error("Couldn't save listing.", {
            description: e instanceof Error ? e.message : undefined,
          }),
      },
    );
  };

  const photos = (listing.photos ?? []).slice().sort((a, b) => a.position - b.position);

  return (
    <HostShell title={listing.title} subtitle={`${listing.city}, ${listing.country} · ${listing.property_type}`}>
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this listing?"
        message="This permanently removes the listing and its photos. Existing bookings are unaffected. This cannot be undone."
        confirmLabel="Delete listing"
        destructive
        loading={del.isPending}
        onConfirm={() =>
          del.mutate(listing.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.success('Listing deleted.');
              onBack();
            },
            onError: (e) =>
              toast.error("Couldn't delete listing.", {
                description: e instanceof Error ? e.message : undefined,
              }),
          })
        }
      />

      <HStack className="mt-2 gap-2 flex-wrap">
        <Badge variant="neutral">published</Badge>
        <Badge variant="neutral">{photos.length} photos</Badge>
      </HStack>

      <View className="mt-6 flex-col md:flex-row gap-6">
        <View className="flex-1 gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Photos</Text>
            {photos.length > 0 ? (
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
            ) : (
              <Text variant="small" className="mt-2 text-ink-soft">
                No photos yet.
              </Text>
            )}
            <Text variant="caption" className="mt-3 text-ink-soft">
              Photo upload + reordering arrives with Supabase Storage. Add photo URLs when creating a
              listing.
            </Text>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Basics</Text>
            <VStack className="mt-3 gap-3">
              <Labeled label="Title">
                <Input value={title} onChangeText={setTitle} placeholder="Listing title" />
              </Labeled>
              <Labeled label="Description">
                <Input
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the space"
                  multiline
                  numberOfLines={4}
                  className="min-h-[88px]"
                  style={{ textAlignVertical: 'top' }}
                />
              </Labeled>
              <Labeled label="Property type">
                <Chips options={PROPERTY_TYPES} selected={[propertyType]} onPick={setPropertyType} />
              </Labeled>
              <HStack className="gap-3">
                <Labeled label="Bedrooms" className="flex-1">
                  <Input value={bedrooms} onChangeText={setBedrooms} keyboardType="number-pad" />
                </Labeled>
                <Labeled label="Bathrooms" className="flex-1">
                  <Input value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" />
                </Labeled>
                <Labeled label="Max guests" className="flex-1">
                  <Input value={guests} onChangeText={setGuests} keyboardType="number-pad" />
                </Labeled>
              </HStack>
            </VStack>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Amenities</Text>
            <View className="mt-3">
              <Chips
                options={AMENITIES as unknown as string[]}
                selected={amenities}
                multi
                onPick={(v) =>
                  setAmenities((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))
                }
              />
            </View>
          </Card>
        </View>

        <View className="md:w-[360px] gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Pricing</Text>
            <VStack className="mt-3 gap-3">
              <Labeled label="Base nightly price">
                <Input value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="120" />
              </Labeled>
              <Labeled label="Currency">
                <Chips options={CURRENCIES} selected={[currency]} onPick={setCurrency} />
              </Labeled>
            </VStack>
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Location</Text>
            <VStack className="mt-3 gap-3">
              <Labeled label="City">
                <Input value={city} onChangeText={setCity} />
              </Labeled>
              <Labeled label="Country">
                <Input value={country} onChangeText={setCountry} />
              </Labeled>
            </VStack>
          </Card>

          <VStack className="gap-2">
            <Button
              variant="secondary"
              loading={update.isPending}
              onPress={save}
            >
              Save changes
            </Button>
            <Button variant="danger" disabled={del.isPending} onPress={() => setConfirmDelete(true)}>
              Delete listing
            </Button>
          </VStack>
        </View>
      </View>

      <View className="mt-8">
        <Pressable onPress={onBack}>
          <Text className="text-ink-soft underline">← Back to all listings</Text>
        </Pressable>
      </View>
    </HostShell>
  );
}

// ---------------------------------------------------------------------------
// Synthetic preview — read-only (no real listing to write to).
// ---------------------------------------------------------------------------

function SyntheticPreview({
  data,
  onBack,
}: {
  data: NonNullable<ReturnType<typeof useHostListing>['data']>;
  onBack: () => void;
}) {
  const { listing: l, bookings, reviews } = data;
  const photos = (l.photos ?? []).slice().sort((a, b) => a.position - b.position);
  const note = () =>
    toast.info('Sign in to a real account to edit', {
      description: 'This is a synthetic preview listing — sign in to manage your own homes.',
    });

  return (
    <HostShell title={l.title} subtitle={`${l.city}, ${l.country} · ${l.property_type}`}>
      <HStack className="mt-2 gap-2 flex-wrap">
        <Badge variant="neutral">preview</Badge>
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
          </Card>

          <Card className="p-5">
            <Text className="font-semibold">Basics</Text>
            <VStack className="mt-3 gap-3">
              <ReadField label="Title" value={l.title} />
              <ReadField label="Description" value={l.description} multiline />
              <HStack className="gap-3">
                <View className="flex-1">
                  <ReadField label="Bedrooms" value={String(l.bedrooms)} />
                </View>
                <View className="flex-1">
                  <ReadField label="Bathrooms" value={String(l.bathrooms)} />
                </View>
                <View className="flex-1">
                  <ReadField label="Max guests" value={String(l.max_guests)} />
                </View>
              </HStack>
            </VStack>
            <Button variant="outline" className="mt-4" onPress={note}>
              Edit
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
          </Card>
        </View>

        <View className="md:w-[360px] gap-6">
          <Card className="p-5">
            <Text className="font-semibold">Pricing</Text>
            <View className="mt-3">
              <Row label="Base nightly" value={formatPrice(l.price_cents, l.currency)} />
              <Row label="Weekend uplift" value="+ 12%" />
              <Row label="Min stay" value="2 nights" />
              <Divider className="my-2" />
              <Row label="Cleaning fee" value={formatPrice(Math.round(l.price_cents * 0.08), l.currency)} />
              <Row label="Service fee" value="3% guest + 12% host" />
            </View>
          </Card>
        </View>
      </View>

      <View className="mt-8">
        <Pressable onPress={onBack}>
          <Text className="text-ink-soft underline">← Back to all listings</Text>
        </Pressable>
      </View>
    </HostShell>
  );
}

// ---------------------------------------------------------------------------

function Labeled({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <VStack className={`gap-1 ${className ?? ''}`}>
      <Text variant="label">{label}</Text>
      {children}
    </VStack>
  );
}

function Chips({
  options,
  selected,
  onPick,
  multi,
}: {
  options: readonly string[];
  selected: string[];
  onPick: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <Pressable
            key={o}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: on }}
            onPress={() => onPick(o)}
            className={`rounded-full border px-4 py-2 ${
              on ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
            }`}
          >
            <Text variant="small" className={on ? 'text-white font-semibold' : 'text-ink'}>
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ReadField({
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
