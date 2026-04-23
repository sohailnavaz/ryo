import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import type { Listing } from '@bnb/db';
import { cn, formatPrice } from '@bnb/utils';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { ChevronLeft, ChevronRight, Heart, Star } from './icons';

export type ListingCardProps = {
  listing: Listing;
  onPress?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  className?: string;
};

export function ListingCard({
  listing,
  onPress,
  isFavorite,
  onToggleFavorite,
  className,
}: ListingCardProps) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = listing.photos ?? [];
  const current = photos[photoIdx]?.url ?? photos[0]?.url;

  const prev = () => setPhotoIdx((i) => (i - 1 + Math.max(1, photos.length)) % Math.max(1, photos.length));
  const next = () => setPhotoIdx((i) => (i + 1) % Math.max(1, photos.length));

  return (
    <Pressable onPress={onPress} className={cn('w-full', className)}>
      <View className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-alt">
        {current ? (
          <Image source={{ uri: current }} className="h-full w-full" resizeMode="cover" />
        ) : null}
        <View className="absolute top-3 right-3">
          <IconButton
            onPress={onToggleFavorite}
            className="bg-black/30"
            testID={`fav-${listing.id}`}
          >
            <Heart
              size={18}
              color={isFavorite ? '#ff385c' : '#ffffff'}
              fill={isFavorite ? '#ff385c' : 'transparent'}
            />
          </IconButton>
        </View>
        {photos.length > 1 ? (
          <>
            <View className="absolute left-2 top-1/2 -mt-4">
              <IconButton onPress={prev} className="bg-white/90 h-8 w-8">
                <ChevronLeft size={16} color="#222" />
              </IconButton>
            </View>
            <View className="absolute right-2 top-1/2 -mt-4">
              <IconButton onPress={next} className="bg-white/90 h-8 w-8">
                <ChevronRight size={16} color="#222" />
              </IconButton>
            </View>
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1">
              {photos.map((p, i) => (
                <View
                  key={p.id}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    i === photoIdx ? 'bg-white' : 'bg-white/60',
                  )}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>
      <View className="mt-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold" numberOfLines={1}>
            {listing.city}, {listing.country}
          </Text>
          {listing.rating_count > 0 ? (
            <View className="flex-row items-center gap-1">
              <Star size={12} color="#222" fill="#222" />
              <Text variant="small">{listing.rating_avg.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>
        <Text variant="small" className="text-ink-soft" numberOfLines={1}>
          {listing.title}
        </Text>
        <Text variant="small" className="text-ink-soft" numberOfLines={1}>
          {listing.bedrooms} {listing.bedrooms === 1 ? 'bed' : 'beds'}
        </Text>
        <Text className="mt-1">
          <Text className="font-semibold">{formatPrice(listing.price_cents, listing.currency)}</Text>
          <Text variant="small" className="text-ink-soft"> night</Text>
        </Text>
      </View>
    </Pressable>
  );
}
