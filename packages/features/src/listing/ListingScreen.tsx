import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import {
  useContentTranslation,
  useFavoriteIds,
  useListing,
  useReviews,
  useToggleFavorite,
} from '@bnb/api';
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
import { ArrowLeft, Bath, Bed, Heart, MapPin, Share2, Star, Users, Pressable, toast } from '@bnb/ui';
import { Map } from '@bnb/ui/Map';
import { shareContent } from '@bnb/ui/share';
import { useRouter } from '@bnb/ui/nav';
import { formatDateRange, formatPrice } from '@bnb/utils';
import { useFiltersStore } from '../state/filtersStore';
import { useT, useLocale } from '../i18n';

export type ListingScreenProps = { id: string };

const SHARE_ORIGIN = 'https://ryo-web.vercel.app';

/** Share a listing via the OS share sheet (native) or Web Share / clipboard (web).
 *  Builds a canonical URL from the id so it works with no `window` on native. */
async function shareListing(opts: { id: string; title: string; city: string }): Promise<'shared' | 'copied' | 'dismissed' | 'failed'> {
  const url =
    typeof window !== 'undefined' ? window.location.href : `${SHARE_ORIGIN}/listing/${opts.id}`;
  return shareContent({
    title: opts.title,
    message: `Check out ${opts.title} in ${opts.city} on Ryo`,
    url,
  });
}

export function ListingScreen({ id }: ListingScreenProps) {
  const t = useT();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id);
  const { data: reviews = [] } = useReviews(id);
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const { filters } = useFiltersStore.getState();
  const { locale } = useLocale();

  // AI-translate the host-written title + description into the active locale
  // (cached; no-op for English). Called before the loading return to keep hook
  // order stable; empty strings until the listing loads.
  const [tTitle, tDescription] = useContentTranslation(
    [listing?.title ?? '', listing?.description ?? ''],
    locale,
  );

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

  const onShare = async () => {
    const result = await shareListing({ id: listing.id, title: listing.title, city: listing.city });
    if (result === 'copied') toast.success('Link copied to clipboard.');
    else if (result === 'failed') toast.info("Couldn't share — your browser doesn't support it.");
    // result === 'shared' → native sheet handled the confirmation
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className={isDesktop ? 'mx-auto w-full max-w-[1120px] px-10 pt-6' : ''}>
          {!isDesktop ? (
            <View className="px-4 py-2 flex-row justify-between">
              <IconButton onPress={() => router.back()} className="bg-surface border border-surface-border">
                <ArrowLeft size={18} color="#0E1A2B" />
              </IconButton>
              <HStack className="gap-2">
                <IconButton
                  className="bg-surface border border-surface-border"
                  onPress={onShare}
                >
                  <Share2 size={18} color="#0E1A2B" />
                </IconButton>
                <IconButton
                  className="bg-surface border border-surface-border"
                  onPress={() => toggleFav.mutate({ listingId: listing.id, on: !isFav })}
                >
                  <Heart
                    size={18}
                    color={isFav ? '#C87156' : '#0E1A2B'}
                    fill={isFav ? '#C87156' : 'transparent'}
                  />
                </IconButton>
              </HStack>
            </View>
          ) : null}

          {isDesktop ? (
            <>
              <HStack className="justify-between items-start gap-4">
                <Heading level={2} className="flex-1">
                  {tTitle || listing.title}
                </Heading>
                <HStack className="gap-4">
                  <Pressable
                    onPress={onShare}
                    accessibilityLabel="Share listing"
                    className="flex-row items-center gap-1.5"
                  >
                    <Share2 size={16} color="#0E1A2B" />
                    <Text className="font-semibold underline">Share</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleFav.mutate({ listingId: listing.id, on: !isFav })}
                    accessibilityLabel="Toggle favourite"
                    className="flex-row items-center gap-1.5"
                  >
                    <Heart
                      size={16}
                      color={isFav ? '#C87156' : '#0E1A2B'}
                      fill={isFav ? '#C87156' : 'transparent'}
                    />
                    <Text className="font-semibold underline">
                      {isFav ? 'Saved' : 'Save'}
                    </Text>
                  </Pressable>
                </HStack>
              </HStack>
              <HStack className="mt-1 flex-wrap gap-2">
                <Star size={14} color="#0E1A2B" fill="#0E1A2B" />
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
                <Heading level={2}>{tTitle || listing.title}</Heading>
                <HStack className="mt-1 flex-wrap gap-2">
                  <Star size={14} color="#0E1A2B" fill="#0E1A2B" />
                  <Text>{listing.rating_avg.toFixed(2)}</Text>
                  <Text className="text-ink-soft">· {listing.city}, {listing.country}</Text>
                </HStack>
              </View>
            ) : null}

            <Divider />

            <HStack className="gap-4 flex-wrap">
              <HStack className="gap-1">
                <Users size={14} color="#0E1A2B" />
                <Text>{listing.max_guests} guests</Text>
              </HStack>
              <HStack className="gap-1">
                <Bed size={14} color="#0E1A2B" />
                <Text>{listing.bedrooms} bedrooms</Text>
              </HStack>
              <HStack className="gap-1">
                <Bath size={14} color="#0E1A2B" />
                <Text>{listing.bathrooms} baths</Text>
              </HStack>
              <Badge>{listing.property_type}</Badge>
            </HStack>

            <Divider />

            <VStack className="gap-2">
              <Heading level={3}>{t('listing.aboutPlace')}</Heading>
              <Text className="text-ink leading-[22px]">{tDescription || listing.description}</Text>
            </VStack>

            <Divider />

            <VStack className="gap-3">
              <Heading level={3}>{t('listing.offers')}</Heading>
              <View className="flex-row flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <Badge key={a}>{a}</Badge>
                ))}
              </View>
            </VStack>

            <Divider />

            <VStack className="gap-3">
              <Heading level={3}>{t('listing.whereYoullBe')}</Heading>
              <HStack className="gap-2">
                <MapPin size={14} color="#0E1A2B" />
                <Text variant="small">
                  {listing.city}, {listing.country}
                </Text>
              </HStack>
              <Map lat={listing.lat} lng={listing.lng} />
            </VStack>

            <Divider />

            <VStack className="gap-3">
              <HStack className="gap-2">
                <Star size={16} color="#0E1A2B" fill="#0E1A2B" />
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
                    <Star size={12} color="#0E1A2B" fill="#0E1A2B" />
                    <Text variant="small">{listing.rating_avg.toFixed(2)}</Text>
                  </HStack>
                </HStack>
                <Pressable
                  onPress={goBook}
                  accessibilityLabel="Choose your dates"
                  className="mt-4 flex-row items-center justify-between rounded-xl border border-surface-border p-3 active:bg-surface-alt"
                >
                  <Text variant="caption" className="font-semibold">
                    {filters.startDate && filters.endDate
                      ? formatDateRange(filters.startDate, filters.endDate)
                      : 'Add dates for prices'}
                  </Text>
                  <Text variant="caption" className="text-brand-600 font-semibold">
                    {filters.startDate && filters.endDate ? 'Edit' : 'Choose'}
                  </Text>
                </Pressable>
                <View className="mt-3">
                  <Button title={t('common.reserve')} fullWidth onPress={goBook} />
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
          <Pressable onPress={goBook} accessibilityLabel="Choose your dates">
            <Text className="font-semibold">
              {formatPrice(listing.price_cents, listing.currency)}{' '}
              <Text className="text-ink-soft font-normal">night</Text>
            </Text>
            <Text variant="caption" className="underline">
              {filters.startDate && filters.endDate
                ? formatDateRange(filters.startDate, filters.endDate)
                : 'Pick your dates'}
            </Text>
          </Pressable>
          <Button title={t('common.reserve')} onPress={goBook} />
        </View>
      ) : null}
    </View>
  );
}
