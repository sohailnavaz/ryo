import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { useFavoriteIds, useListing, useReviews, useToggleFavorite } from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  IconButton,
  PriceTotal,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { ArrowLeft, Bath, Bed, Heart, MapPin, Share2, Star, Users } from '@bnb/ui';
import { Map } from '@bnb/ui/Map';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';
import { useFiltersStore } from '../state/filtersStore';

export type ListingScreenProps = { id: string };

export function ListingScreen({ id }: ListingScreenProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id);
  const { data: reviews = [] } = useReviews(id);
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const { filters } = useFiltersStore.getState();

  const isDesktop = width >= 1024;

  if (isLoading || !listing) {
    return (
      <View className="flex-1 bg-surface p-4 gap-4">
        <Skeleton className="h-[360px] w-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </View>
    );
  }

  const isFav = favIds.includes(listing.id);
  const goBook = () => router.push(`/booking/${listing.id}`);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className={isDesktop ? 'mx-auto w-full max-w-[1120px] px-10 pt-6' : ''}>
          {!isDesktop ? (
            <View className="px-4 py-2 flex-row justify-between">
              <IconButton onPress={() => router.back()} className="bg-surface border border-surface-border">
                <ArrowLeft size={18} color="#222" />
              </IconButton>
              <HStack className="gap-2">
                <IconButton className="bg-surface border border-surface-border">
                  <Share2 size={18} color="#222" />
                </IconButton>
                <IconButton
                  className="bg-surface border border-surface-border"
                  onPress={() => toggleFav.mutate({ listingId: listing.id, on: !isFav })}
                >
                  <Heart
                    size={18}
                    color={isFav ? '#ff385c' : '#222'}
                    fill={isFav ? '#ff385c' : 'transparent'}
                  />
                </IconButton>
              </HStack>
            </View>
          ) : null}

          {isDesktop ? (
            <>
              <Heading level={2}>{listing.title}</Heading>
              <HStack className="mt-1 flex-wrap gap-2">
                <Star size={14} color="#222" fill="#222" />
                <Text>{listing.rating_avg.toFixed(2)}</Text>
                <Text className="text-ink-soft">· {listing.rating_count} reviews</Text>
                <Text className="text-ink-soft">· {listing.city}, {listing.country}</Text>
              </HStack>
              <View className="mt-4 grid grid-cols-4 gap-2" style={{ height: 440 } as never}>
                <View className="col-span-2 row-span-2">
                  {listing.photos[0] ? (
                    <Image
                      source={{ uri: listing.photos[0].url }}
                      style={{ width: '100%', height: '100%', borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                {listing.photos.slice(1, 5).map((p, i) => (
                  <Image
                    key={p.id}
                    source={{ uri: p.url }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderTopRightRadius: i === 1 ? 16 : 0,
                      borderBottomRightRadius: i === 3 ? 16 : 0,
                    }}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </>
          ) : (
            <View className="aspect-[4/3] w-full">
              {listing.photos[0] ? (
                <Image
                  source={{ uri: listing.photos[0].url }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : null}
            </View>
          )}
        </View>

        <View className={`px-4 md:px-10 md:mx-auto md:w-full md:max-w-[1120px] ${isDesktop ? 'flex-row gap-16' : ''}`}>
          <View className={isDesktop ? 'flex-1' : ''}>
            {!isDesktop ? (
              <View className="pt-4">
                <Heading level={2}>{listing.title}</Heading>
                <HStack className="mt-1 flex-wrap gap-2">
                  <Star size={14} color="#222" fill="#222" />
                  <Text>{listing.rating_avg.toFixed(2)}</Text>
                  <Text className="text-ink-soft">· {listing.city}, {listing.country}</Text>
                </HStack>
              </View>
            ) : null}

            <Divider />

            <HStack className="gap-4 flex-wrap">
              <HStack className="gap-1">
                <Users size={14} color="#222" />
                <Text>{listing.max_guests} guests</Text>
              </HStack>
              <HStack className="gap-1">
                <Bed size={14} color="#222" />
                <Text>{listing.bedrooms} bedrooms</Text>
              </HStack>
              <HStack className="gap-1">
                <Bath size={14} color="#222" />
                <Text>{listing.bathrooms} baths</Text>
              </HStack>
              <Badge>{listing.property_type}</Badge>
            </HStack>

            <Divider />

            <VStack className="gap-2">
              <Heading level={3}>About this place</Heading>
              <Text className="text-ink leading-[22px]">{listing.description}</Text>
            </VStack>

            <Divider />

            <VStack className="gap-3">
              <Heading level={3}>What this place offers</Heading>
              <View className="flex-row flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <Badge key={a}>{a}</Badge>
                ))}
              </View>
            </VStack>

            <Divider />

            <VStack className="gap-3">
              <Heading level={3}>Where you'll be</Heading>
              <HStack className="gap-2">
                <MapPin size={14} color="#222" />
                <Text variant="small">
                  {listing.city}, {listing.country}
                </Text>
              </HStack>
              <Map lat={listing.lat} lng={listing.lng} />
            </VStack>

            <Divider />

            <VStack className="gap-3">
              <HStack className="gap-2">
                <Star size={16} color="#222" fill="#222" />
                <Heading level={3}>
                  {listing.rating_avg.toFixed(2)} · {listing.rating_count} reviews
                </Heading>
              </HStack>
              {reviews.slice(0, 6).map((r) => (
                <Card key={r.id} className="p-4">
                  <HStack className="gap-3">
                    <Avatar src={r.author_avatar} name={r.author_name} size={36} />
                    <VStack>
                      <Text className="font-semibold">{r.author_name}</Text>
                      <Text variant="caption">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </VStack>
                  </HStack>
                  <Text className="mt-2">{r.body}</Text>
                </Card>
              ))}
              {reviews.length === 0 ? (
                <Text className="text-ink-soft">No reviews yet.</Text>
              ) : null}
            </VStack>
          </View>

          {isDesktop ? (
            <View className="w-[380px]">
              <Card className="sticky top-24 p-6 shadow-pop">
                <HStack className="items-end justify-between">
                  <Text className="text-[22px] font-semibold">
                    {formatPrice(listing.price_cents, listing.currency)}
                    <Text className="text-[15px] text-ink-soft font-normal"> night</Text>
                  </Text>
                  <HStack className="gap-1">
                    <Star size={12} color="#222" fill="#222" />
                    <Text variant="small">{listing.rating_avg.toFixed(2)}</Text>
                  </HStack>
                </HStack>
                <View className="mt-4 rounded-xl border border-surface-border p-3">
                  <Text variant="caption" className="font-semibold">
                    {filters.startDate && filters.endDate
                      ? formatDateRange(filters.startDate, filters.endDate)
                      : 'Add dates for prices'}
                  </Text>
                </View>
                <View className="mt-3">
                  <Button title="Reserve" fullWidth onPress={goBook} />
                </View>
                <View className="mt-4">
                  <PriceTotal
                    pricePerNight={listing.price_cents}
                    currency={listing.currency}
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                  />
                </View>
              </Card>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {!isDesktop ? (
        <View className="absolute bottom-0 left-0 right-0 border-t border-surface-border bg-surface px-4 py-3 flex-row items-center justify-between">
          <VStack>
            <Text className="font-semibold">
              {formatPrice(listing.price_cents, listing.currency)}{' '}
              <Text className="text-ink-soft font-normal">night</Text>
            </Text>
            <Text variant="caption" className="underline">
              {filters.startDate && filters.endDate
                ? formatDateRange(filters.startDate, filters.endDate)
                : 'Pick your dates'}
            </Text>
          </VStack>
          <Button title="Reserve" onPress={goBook} />
        </View>
      ) : null}
    </View>
  );
}
