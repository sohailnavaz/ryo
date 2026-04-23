import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useCreateBooking, useListing } from '@bnb/api';
import {
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
  VStack,
} from '@bnb/ui';
import { computeBookingTotal } from '@bnb/ui';
import { ArrowLeft } from '@bnb/ui';
import { Calendar } from '@bnb/ui/Calendar';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange } from '@bnb/utils';
import { useFiltersStore } from '../state/filtersStore';

export type BookingScreenProps = { id: string };

export function BookingScreen({ id }: BookingScreenProps) {
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id);
  const filters = useFiltersStore((s) => s.filters);
  const setFilters = useFiltersStore((s) => s.setFilters);
  const [guests, setGuests] = useState(Math.max(1, filters.guests ?? 1));
  const createBooking = useCreateBooking();

  if (isLoading || !listing) {
    return (
      <View className="flex-1 bg-surface p-4">
        <Text>Loading…</Text>
      </View>
    );
  }

  const confirm = async () => {
    if (!filters.startDate || !filters.endDate) return;
    const total = computeBookingTotal(listing.price_cents, filters.startDate, filters.endDate);
    try {
      await createBooking.mutateAsync({
        listing_id: listing.id,
        start_date: filters.startDate,
        end_date: filters.endDate,
        total_cents: total,
      });
      router.replace('/trips');
    } catch (e) {
      console.warn('Booking failed', e);
    }
  };

  const canBook = !!(filters.startDate && filters.endDate) && guests <= listing.max_guests;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-4 py-4 flex-row items-center gap-3 md:px-10 md:mx-auto md:w-full md:max-w-[920px]">
        <IconButton onPress={() => router.back()} className="bg-surface border border-surface-border">
          <ArrowLeft size={18} color="#222" />
        </IconButton>
        <Heading level={2}>Confirm and pay</Heading>
      </View>
      <View className="px-4 md:px-10 md:mx-auto md:w-full md:max-w-[920px] md:flex-row md:gap-12">
        <VStack className="flex-1 gap-5">
          <Card className="p-4">
            <Heading level={4}>Your trip</Heading>
            <View className="mt-3 gap-3">
              <HStack className="justify-between">
                <VStack>
                  <Text className="font-semibold">Dates</Text>
                  <Text variant="small" className="text-ink-soft">
                    {filters.startDate && filters.endDate
                      ? formatDateRange(filters.startDate, filters.endDate)
                      : 'Select dates'}
                  </Text>
                </VStack>
              </HStack>
              <Calendar
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={(s, e) => setFilters({ startDate: s, endDate: e })}
              />
              <Divider className="my-0" />
              <HStack className="justify-between">
                <VStack>
                  <Text className="font-semibold">Guests</Text>
                  <Text variant="small" className="text-ink-soft">
                    {guests} {guests === 1 ? 'guest' : 'guests'} · max {listing.max_guests}
                  </Text>
                </VStack>
                <HStack className="gap-2">
                  <IconButton
                    onPress={() => setGuests((g) => Math.max(1, g - 1))}
                    className="border border-surface-border"
                    disabled={guests <= 1}
                  >
                    <Minus size={16} color="#222" />
                  </IconButton>
                  <Text className="w-6 text-center font-semibold">{guests}</Text>
                  <IconButton
                    onPress={() => setGuests((g) => Math.min(listing.max_guests, g + 1))}
                    className="border border-surface-border"
                    disabled={guests >= listing.max_guests}
                  >
                    <Plus size={16} color="#222" />
                  </IconButton>
                </HStack>
              </HStack>
            </View>
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
                  /* eslint-disable-next-line */
                  // @ts-ignore JSX Image from RN renders fine via RNW on web
                  <img
                    src={listing.photos[0].url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
              <PriceTotal
                pricePerNight={listing.price_cents}
                currency={listing.currency}
                startDate={filters.startDate}
                endDate={filters.endDate}
              />
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
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
