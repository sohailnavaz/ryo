import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { tryGetSupabase, useCreateListing, type ListingInput } from '@bnb/api';
import { AMENITIES } from '@bnb/db';
import {
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Input,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

const PROPERTY_TYPES = ['House', 'Apartment', 'Cabin', 'Villa', 'Treehouse', 'Cottage'];
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD'];

export function HostListingCreateScreen() {
  const router = useRouter();
  const create = useCreateListing();
  const supabaseConfigured = tryGetSupabase() !== null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('House');
  const [price, setPrice] = useState(''); // dollars/major units
  const [currency, setCurrency] = useState('USD');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [guests, setGuests] = useState('2');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');

  const num = (s: string, d = 0) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : d;
  };

  const valid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    num(price) > 0 &&
    city.trim().length > 0 &&
    country.trim().length > 0;

  const submit = () => {
    if (!supabaseConfigured) {
      toast.info('Creating a listing needs a signed-in account (Supabase not configured here).');
      return;
    }
    if (!valid) {
      toast.warning('Add a title, description, price, city and country first.');
      return;
    }
    const input: ListingInput = {
      title: title.trim(),
      description: description.trim(),
      price_cents: Math.round(num(price) * 100),
      currency,
      property_type: propertyType,
      bedrooms: num(bedrooms, 1),
      bathrooms: num(bathrooms, 1),
      max_guests: num(guests, 2),
      city: city.trim(),
      country: country.trim(),
      amenities,
      photo_urls: photoUrl.trim() ? [photoUrl.trim()] : [],
    };
    create.mutate(input, {
      onSuccess: (id) => {
        toast.success('Listing published.', { description: `${title.trim()} is now live.` });
        router.replace(`/listing/${id}`);
      },
      onError: (e) =>
        toast.error("Couldn't publish your listing.", {
          description: e instanceof Error ? e.message : undefined,
        }),
    });
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="md:mx-auto md:w-full md:max-w-[760px] px-4 pt-6 pb-24 md:px-10 md:pt-8 gap-6">
        <VStack className="gap-1">
          <Text variant="small" className="text-ink-soft uppercase tracking-wider">
            Host · new listing
          </Text>
          <Heading level={1}>List your place</Heading>
          <Text className="text-ink-soft">
            The essentials to get live. You can refine photos, calendar and pricing after.
          </Text>
        </VStack>

        {!supabaseConfigured ? (
          <Card className="p-4 bg-surface-alt border-0">
            <Text variant="small" className="text-ink-soft">
              Preview mode — sign in with a real account to publish a listing that persists.
            </Text>
          </Card>
        ) : null}

        <Card className="p-5 gap-4">
          <Heading level={3}>The basics</Heading>
          <Divider />
          <Field label="Title">
            <Input value={title} onChangeText={setTitle} placeholder="Cliffside villa with ocean view" />
          </Field>
          <Field label="Description">
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="What makes this place special?"
              multiline
              numberOfLines={4}
            />
          </Field>
          <Field label="Property type">
            <Chips options={PROPERTY_TYPES} selected={[propertyType]} onPick={setPropertyType} />
          </Field>
        </Card>

        <Card className="p-5 gap-4">
          <Heading level={3}>Space & capacity</Heading>
          <Divider />
          <HStack className="gap-3">
            <Field label="Bedrooms" className="flex-1">
              <Input value={bedrooms} onChangeText={setBedrooms} keyboardType="number-pad" />
            </Field>
            <Field label="Bathrooms" className="flex-1">
              <Input value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" />
            </Field>
            <Field label="Max guests" className="flex-1">
              <Input value={guests} onChangeText={setGuests} keyboardType="number-pad" />
            </Field>
          </HStack>
        </Card>

        <Card className="p-5 gap-4">
          <Heading level={3}>Location</Heading>
          <Divider />
          <HStack className="gap-3">
            <Field label="City" className="flex-1">
              <Input value={city} onChangeText={setCity} placeholder="Goa" />
            </Field>
            <Field label="Country" className="flex-1">
              <Input value={country} onChangeText={setCountry} placeholder="India" />
            </Field>
          </HStack>
        </Card>

        <Card className="p-5 gap-4">
          <Heading level={3}>Price</Heading>
          <Divider />
          <HStack className="gap-3 items-end">
            <Field label={`Per night (${currency})`} className="flex-1">
              <Input value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="280" />
            </Field>
            <Field label="Currency" className="flex-[2]">
              <Chips options={CURRENCIES} selected={[currency]} onPick={setCurrency} />
            </Field>
          </HStack>
        </Card>

        <Card className="p-5 gap-4">
          <Heading level={3}>Amenities</Heading>
          <Divider />
          <Chips
            options={AMENITIES as unknown as string[]}
            selected={amenities}
            multi
            onPick={(v) =>
              setAmenities((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))
            }
          />
        </Card>

        <Card className="p-5 gap-4">
          <Heading level={3}>Photo</Heading>
          <Divider />
          <Field label="Photo URL">
            <Input
              value={photoUrl}
              onChangeText={setPhotoUrl}
              placeholder="https://images.unsplash.com/…"
              autoCapitalize="none"
            />
          </Field>
          <Text variant="caption">
            Paste an image URL for now. Drag-and-drop upload arrives with file storage.
          </Text>
        </Card>

        <HStack className="gap-2 justify-end">
          <Button title="Cancel" variant="ghost" onPress={() => router.push('/host/listings')} />
          <Button
            title={create.isPending ? 'Publishing…' : 'Publish listing'}
            onPress={submit}
            loading={create.isPending}
            disabled={!valid && supabaseConfigured}
          />
        </HStack>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <VStack className={`gap-1.5 ${className ?? ''}`}>
      <Text variant="small" className="text-ink-soft font-semibold">
        {label}
      </Text>
      {children}
    </VStack>
  );
}

function Chips({
  options,
  selected,
  onPick,
  multi = false,
}: {
  options: readonly string[];
  selected: string[];
  onPick: (v: string) => void;
  multi?: boolean;
}) {
  void multi;
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Button
          key={o}
          title={o}
          variant={selected.includes(o) ? 'primary' : 'outline'}
          onPress={() => onPick(o)}
        />
      ))}
    </View>
  );
}
