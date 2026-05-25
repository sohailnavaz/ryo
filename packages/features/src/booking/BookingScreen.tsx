import { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import {
  BookingDatesTakenError,
  useCreateBooking,
  useListing,
  useListingBookedRanges,
} from '@bnb/api';
import {
  ArrowLeft,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  IconButton,
  Minus,
  Plus,
  PriceTotal,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { Calendar } from '@bnb/ui/Calendar';
import { useRouter } from '@bnb/ui/nav';
import {
  billableGuests,
  computePricing,
  EMPTY_GUESTS,
  formatDateRange,
  nightsBetween,
  type GuestCounts,
} from '@bnb/utils';
import { useFiltersStore } from '../state/filtersStore';

export type BookingScreenProps = { id: string };

/** True if [start, end) overlaps any booked range (end is checkout, exclusive). */
function overlapsBooked(
  start: string,
  end: string,
  ranges: { start_date: string; end_date: string }[],
): boolean {
  return ranges.some((r) => start < r.end_date && end > r.start_date);
}

export function BookingScreen({ id }: BookingScreenProps) {
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id);
  const { data: bookedRanges = [] } = useListingBookedRanges(id);
  const filters = useFiltersStore((s) => s.filters);
  const setFilters = useFiltersStore((s) => s.setFilters);
  const [guests, setGuests] = useState<GuestCounts>({
    ...EMPTY_GUESTS,
    adults: Math.max(1, filters.guests ?? 1),
  });
  const createBooking = useCreateBooking();

  // If the dates carried in from search collide with a booked range, clear them
  // so the guest re-picks against live availability.
  useEffect(() => {
    if (
      filters.startDate &&
      filters.endDate &&
      overlapsBooked(filters.startDate, filters.endDate, bookedRanges)
    ) {
      setFilters({ startDate: undefined, endDate: undefined });
      toast.info('Those dates are no longer open.', {
        description: 'Greyed-out days are already booked — pick from what’s available.',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookedRanges]);

  if (isLoading || !listing) {
    return (
      <View className="flex-1 bg-surface p-4">
        <Text>Loading…</Text>
      </View>
    );
  }

  const nights =
    filters.startDate && filters.endDate
      ? nightsBetween(filters.startDate, filters.endDate)
      : 0;
  const breakdown = computePricing({
    pricePerNightCents: listing.price_cents,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const capacity = billableGuests(guests);
  const overCapacity = capacity > listing.max_guests;

  const onPickDates = (s?: string, e?: string) => {
    if (s && e && overlapsBooked(s, e, bookedRanges)) {
      toast.warning('That range crosses a booked stay.', {
        description: 'Pick dates that don’t include greyed-out days.',
      });
      setFilters({ startDate: s, endDate: undefined });
      return;
    }
    setFilters({ startDate: s, endDate: e });
  };

  const confirm = async () => {
    if (!filters.startDate || !filters.endDate) return;
    if (overlapsBooked(filters.startDate, filters.endDate, bookedRanges)) {
      toast.warning('Those dates are taken.', { description: 'Pick different dates.' });
      return;
    }
    try {
      await createBooking.mutateAsync({
        listing_id: listing.id,
        start_date: filters.startDate,
        end_date: filters.endDate,
        total_cents: breakdown.totalCents,
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
        pets: guests.pets,
        subtotal_cents: breakdown.subtotalCents,
        cleaning_fee_cents: breakdown.cleaningFeeCents,
        service_fee_cents: breakdown.serviceFeeCents,
        taxes_cents: breakdown.taxesCents,
        discount_cents: breakdown.discountCents,
      });
      const guestLabel = `${capacity} guest${capacity === 1 ? '' : 's'}${
        guests.infants ? `, ${guests.infants} infant${guests.infants === 1 ? '' : 's'}` : ''
      }${guests.pets ? `, ${guests.pets} pet${guests.pets === 1 ? '' : 's'}` : ''}`;
      toast.success(`You're booked at ${listing.title}.`, {
        description: `${formatDateRange(filters.startDate, filters.endDate)} · ${guestLabel}.`,
      });
      router.replace('/trips');
    } catch (e) {
      if (e instanceof BookingDatesTakenError) {
        toast.warning('Those dates just got booked.', {
          description: 'Pick different dates and we’ll try again.',
        });
        return;
      }
      const msg = e instanceof Error ? e.message : 'Something went wrong confirming your booking.';
      toast.error("Couldn't confirm your booking.", { description: msg });
    }
  };

  const canBook = nights > 0 && !overCapacity && guests.adults >= 1;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-4 py-4 flex-row items-center gap-3 md:px-10 md:mx-auto md:w-full md:max-w-[920px]">
        <IconButton onPress={() => router.back()} className="bg-surface border border-surface-border">
          <ArrowLeft size={18} color="#0E1A2B" />
        </IconButton>
        <Heading level={2}>Confirm and pay</Heading>
      </View>
      <View className="px-4 md:px-10 md:mx-auto md:w-full md:max-w-[920px] md:flex-row md:gap-12">
        <VStack className="flex-1 gap-5">
          <Card className="p-4">
            <Heading level={4}>Your dates</Heading>
            <View className="mt-3 gap-3">
              <HStack className="justify-between">
                <VStack>
                  <Text className="font-semibold">Dates</Text>
                  <Text variant="small" className="text-ink-soft">
                    {filters.startDate && filters.endDate
                      ? `${formatDateRange(filters.startDate, filters.endDate)} · ${nights} ${nights === 1 ? 'night' : 'nights'}`
                      : 'Select dates'}
                  </Text>
                </VStack>
              </HStack>
              <Calendar
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={onPickDates}
                bookedRanges={bookedRanges.map((r) => ({ start: r.start_date, end: r.end_date }))}
              />
              <Text variant="caption" className="text-ink-soft">
                Greyed-out days are already booked.
              </Text>
            </View>
          </Card>

          <Card className="p-4">
            <Heading level={4}>Guests</Heading>
            <Text variant="small" className="text-ink-soft mt-1">
              {capacity} of {listing.max_guests} {listing.max_guests === 1 ? 'spot' : 'spots'} used
              {overCapacity ? ' — over capacity' : ''}
            </Text>
            <View className="mt-3 gap-1">
              <GuestRow
                label="Adults"
                hint="Ages 13+"
                value={guests.adults}
                min={1}
                onChange={(v) => setGuests((g) => ({ ...g, adults: v }))}
                canIncrement={capacity < listing.max_guests}
              />
              <Divider className="my-1" />
              <GuestRow
                label="Children"
                hint="Ages 2–12"
                value={guests.children}
                onChange={(v) => setGuests((g) => ({ ...g, children: v }))}
                canIncrement={capacity < listing.max_guests}
              />
              <Divider className="my-1" />
              <GuestRow
                label="Infants"
                hint="Under 2 · don’t count toward capacity"
                value={guests.infants}
                onChange={(v) => setGuests((g) => ({ ...g, infants: v }))}
              />
              <Divider className="my-1" />
              <GuestRow
                label="Pets"
                hint="Bringing a service animal?"
                value={guests.pets}
                onChange={(v) => setGuests((g) => ({ ...g, pets: v }))}
              />
            </View>
            {overCapacity ? (
              <Text variant="small" className="text-brand-600 mt-3">
                This home hosts up to {listing.max_guests}. Reduce adults or children to continue.
              </Text>
            ) : null}
          </Card>

          <Card className="p-4">
            <Heading level={4}>Pay with</Heading>
            <Text variant="small" className="text-ink-soft mt-2">
              Mock payment in v1 — no card is charged.
            </Text>
          </Card>
        </VStack>

        <View className="w-full md:w-[380px] mt-5 md:mt-0">
          <Card className="p-4">
            <HStack className="gap-3">
              <View className="h-20 w-24 overflow-hidden rounded-xl bg-surface-alt">
                {listing.photos[0] ? (
                  <Image
                    source={{ uri: listing.photos[0].url }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
              <VStack className="flex-1">
                <Text className="font-semibold" numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text variant="small" className="text-ink-soft">
                  {listing.city}, {listing.country}
                </Text>
              </VStack>
            </HStack>
            <Divider />
            <Heading level={4}>Price details</Heading>
            <View className="mt-3">
              <PriceTotal breakdown={breakdown} currency={listing.currency} />
            </View>
            <View className="mt-4">
              <Button
                title={createBooking.isPending ? 'Confirming…' : 'Confirm booking'}
                onPress={confirm}
                disabled={!canBook || createBooking.isPending}
                loading={createBooking.isPending}
                fullWidth
              />
            </View>
            {nights === 0 ? (
              <Text variant="caption" className="text-ink-soft mt-2 text-center">
                Pick your dates to see the total.
              </Text>
            ) : null}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function GuestRow({
  label,
  hint,
  value,
  min = 0,
  onChange,
  canIncrement = true,
}: {
  label: string;
  hint: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
  canIncrement?: boolean;
}) {
  return (
    <HStack className="justify-between items-center py-1">
      <VStack>
        <Text className="font-semibold">{label}</Text>
        <Text variant="caption" className="text-ink-soft">
          {hint}
        </Text>
      </VStack>
      <HStack className="gap-3 items-center">
        <IconButton
          onPress={() => onChange(Math.max(min, value - 1))}
          className="border border-surface-border"
          disabled={value <= min}
        >
          <Minus size={16} color="#0E1A2B" />
        </IconButton>
        <Text className="w-6 text-center font-semibold">{value}</Text>
        <IconButton
          onPress={() => onChange(value + 1)}
          className="border border-surface-border"
          disabled={!canIncrement}
        >
          <Plus size={16} color="#0E1A2B" />
        </IconButton>
      </HStack>
    </HStack>
  );
}
