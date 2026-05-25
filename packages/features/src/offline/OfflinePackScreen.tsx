import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  confirmationCodeFor,
  lookupEmergencyNumbers,
  saveOfflinePack,
  useGuestDashboard,
  useOfflinePack,
  FALLBACK_GENERAL,
  type EmergencyNumbers,
  type OfflineTrip,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Pressable,
  Text,
  VStack,
} from '@bnb/ui';

// Offline Stay Pack — the screen a traveler can open with zero signal.
// Online, it refreshes the cached pack from the guest dashboard; offline, it
// reads straight from localStorage (useOfflinePack). Built from @bnb/ui only;
// react-native imports limited to the layout-only allowlist (View/ScrollView).

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(+d)) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

function callNumber(num: string) {
  if (typeof window !== 'undefined') {
    window.location.href = `tel:${num.replace(/[^+\d]/g, '')}`;
  }
}

export function OfflinePackScreen() {
  const online = useIsOnline();
  const pack = useOfflinePack();
  const { data: dashboard } = useGuestDashboard();

  // While online, mirror the upcoming + in-stay trips into the offline cache so
  // they're there next time the network isn't.
  useEffect(() => {
    if (!dashboard) return;
    const trips: OfflineTrip[] = dashboard.bookings
      .filter((b) => b.status === 'upcoming' || b.status === 'in_stay')
      .map((b) => ({
        id: b.id,
        listing_id: b.listing_id,
        listing_title: b.listing_title,
        address: [b.listing_city, b.listing_country].filter(Boolean).join(', '),
        city: b.listing_city,
        country: b.listing_country,
        check_in: b.start_date,
        check_out: b.end_date,
        nights: b.nights,
        host_name: b.host_name,
        confirmation_code: confirmationCodeFor(b.id),
        total_cents: b.total_cents,
        currency: b.currency,
      }));
    saveOfflinePack(dashboard.user.id ?? 'anon', trips);
  }, [dashboard]);

  const trips = pack.trips;
  const primary = trips[0];

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="px-4 md:px-8 py-8 max-w-[900px] mx-auto w-full">
        <HStack className="items-center justify-between gap-3 flex-wrap">
          <VStack className="gap-1 flex-1">
            <Heading level={1}>Stay pack</Heading>
            <Text className="text-ink-soft">
              Your trip, emergency numbers and help — kept on this device so it works without signal.
            </Text>
          </VStack>
          <Badge variant="dark">Available offline</Badge>
        </HStack>

        <HStack className="mt-3 items-center gap-2">
          <View
            className={`h-2 w-2 rounded-full ${online ? 'bg-brand-500' : 'bg-ink-soft'}`}
          />
          <Text variant="small" className="text-ink-soft">
            {online
              ? 'Online — saving the latest version of your trip to this device.'
              : "You're offline — showing the last saved copy of your trip."}
          </Text>
        </HStack>

        {/* Trip essentials */}
        <View className="mt-6">
          <Heading level={3}>Your stay</Heading>
          {!primary ? (
            <Card className="mt-3 p-6 items-center">
              <Text className="font-semibold">No upcoming stay saved yet</Text>
              <Text variant="small" className="text-ink-soft text-center mt-1">
                Open this page once while online and your next trip will be saved here for offline use.
              </Text>
            </Card>
          ) : (
            trips.map((t) => <TripCard key={t.id} trip={t} />)
          )}
        </View>

        {/* Emergency numbers for the destination */}
        <View className="mt-8">
          <Heading level={3}>Emergency numbers</Heading>
          <EmergencyCard country={primary?.country} />
        </View>

        {/* Offline-readable help */}
        <View className="mt-8">
          <Heading level={3}>Help &amp; FAQ</Heading>
          <HelpCard />
        </View>

        {pack.saved_at ? (
          <Text variant="small" className="text-ink-soft mt-8 text-center">
            Saved {new Date(pack.saved_at).toLocaleString()}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function TripCard({ trip }: { trip: OfflineTrip }) {
  return (
    <Card className="mt-3 p-5">
      <HStack className="justify-between items-start gap-3">
        <VStack className="flex-1 gap-0.5">
          <Text className="font-semibold text-[17px]">{trip.listing_title}</Text>
          <Text variant="small" className="text-ink-soft">
            {trip.address}
          </Text>
        </VStack>
        <Badge variant="neutral">{trip.confirmation_code}</Badge>
      </HStack>

      <Divider className="my-4" />

      <HStack className="gap-6 flex-wrap">
        <VStack className="gap-0.5">
          <Text variant="small" className="text-ink-soft">
            Check-in
          </Text>
          <Text className="font-semibold">{formatDate(trip.check_in)}</Text>
        </VStack>
        <VStack className="gap-0.5">
          <Text variant="small" className="text-ink-soft">
            Check-out
          </Text>
          <Text className="font-semibold">{formatDate(trip.check_out)}</Text>
        </VStack>
        <VStack className="gap-0.5">
          <Text variant="small" className="text-ink-soft">
            Nights
          </Text>
          <Text className="font-semibold">{trip.nights}</Text>
        </VStack>
      </HStack>

      <Divider className="my-4" />

      <HStack className="justify-between items-center gap-3 flex-wrap">
        <VStack className="gap-0.5">
          <Text variant="small" className="text-ink-soft">
            Host
          </Text>
          <Text className="font-semibold">{trip.host_name}</Text>
        </VStack>
        {trip.host_phone ? (
          <Button variant="secondary" onPress={() => callNumber(trip.host_phone!)}>
            Call host
          </Button>
        ) : null}
      </HStack>

      <View className="mt-4 rounded-xl bg-surface-alt px-4 py-3">
        <HStack className="justify-between items-center">
          <Text variant="small" className="text-ink-soft">
            Receipt total
          </Text>
          <Text className="font-semibold">{formatMoney(trip.total_cents, trip.currency)}</Text>
        </HStack>
      </View>
    </Card>
  );
}

function Row({ label, num }: { label: string; num?: string }) {
  if (!num) return null;
  return (
    <Pressable onPress={() => callNumber(num)}>
      <HStack className="justify-between items-center py-3">
        <Text className="font-medium">{label}</Text>
        <Badge variant="brand">{num}</Badge>
      </HStack>
    </Pressable>
  );
}

function EmergencyCard({ country }: { country?: string }) {
  const numbers: EmergencyNumbers | undefined = useMemo(
    () => lookupEmergencyNumbers(country),
    [country],
  );

  if (!numbers) {
    return (
      <Card className="mt-3 p-5">
        <Text className="text-ink-soft">
          {country
            ? `We don't have a saved table for ${country} yet.`
            : 'No destination saved yet.'}
        </Text>
        <Divider className="my-3" />
        <Row label="International emergency" num={FALLBACK_GENERAL} />
        <Text variant="small" className="text-ink-soft mt-1">
          112 reaches emergency services across the EU and many other countries from any phone.
        </Text>
      </Card>
    );
  }

  return (
    <Card className="mt-3 p-5">
      <Text className="font-semibold">{numbers.country}</Text>
      <Text variant="small" className="text-ink-soft">
        Tap a number to call. Works without signal on most networks.
      </Text>
      <Divider className="my-2" />
      <Row label="General emergency" num={numbers.general} />
      <Row label="Police" num={numbers.police} />
      <Row label="Ambulance" num={numbers.ambulance} />
      <Row label="Fire" num={numbers.fire} />
      <Row label="Tourist helpline" num={numbers.tourist} />
      <Divider className="my-2" />
      <Row label="International fallback" num={FALLBACK_GENERAL} />
    </Card>
  );
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "I'm locked out or feel unsafe right now.",
    a: 'Call the local emergency number above first. When you have signal again, open Help in the app — our concierge can dispatch local contacts and arrange a re-book.',
  },
  {
    q: "The place isn't as described at check-in.",
    a: 'Take photos. With signal, raise a request under Help — Guest Arrival Protection can re-book a comparable stay at no extra cost or offer a full refund.',
  },
  {
    q: "I can't reach my host.",
    a: 'Try the host number on your stay card. If you still can\'t reach them, our concierge steps in the moment you\'re back online.',
  },
  {
    q: 'Where do I find my confirmation code?',
    a: 'It\'s on your stay card above (RYO-XXXXXX). Quote it to the concierge or local support to pull up your booking fast.',
  },
];

function HelpCard() {
  return (
    <Card className="mt-3 p-5">
      <VStack className="gap-4">
        {FAQ.map((item, i) => (
          <View key={i}>
            <Text className="font-semibold">{item.q}</Text>
            <Text variant="small" className="text-ink-soft mt-1">
              {item.a}
            </Text>
            {i < FAQ.length - 1 ? <Divider className="mt-4" /> : null}
          </View>
        ))}
      </VStack>
    </Card>
  );
}
