import { View } from 'react-native';
import { formatPrice, nightsBetween } from '@bnb/utils';
import { Divider } from './Divider';
import { Text } from './Text';

export type PriceTotalProps = {
  pricePerNight: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  cleaningFee?: number;
  serviceFee?: number;
};

export function PriceTotal({
  pricePerNight,
  currency = 'USD',
  startDate,
  endDate,
  cleaningFee = 4500,
  serviceFee,
}: PriceTotalProps) {
  const nights = startDate && endDate ? nightsBetween(startDate, endDate) : 0;
  const subtotal = nights * pricePerNight;
  const service = serviceFee ?? Math.round(subtotal * 0.14);
  const total = subtotal + (nights > 0 ? cleaningFee + service : 0);

  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <Text className="underline">
          {formatPrice(pricePerNight, currency)} × {nights || 0} nights
        </Text>
        <Text>{formatPrice(subtotal, currency)}</Text>
      </View>
      {nights > 0 ? (
        <>
          <View className="flex-row justify-between">
            <Text className="underline">Cleaning fee</Text>
            <Text>{formatPrice(cleaningFee, currency)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="underline">Service fee</Text>
            <Text>{formatPrice(service, currency)}</Text>
          </View>
        </>
      ) : null}
      <Divider className="my-2" />
      <View className="flex-row justify-between">
        <Text className="font-semibold">Total</Text>
        <Text className="font-semibold">{formatPrice(total, currency)}</Text>
      </View>
    </View>
  );
}

export function computeBookingTotal(
  pricePerNight: number,
  startDate?: string,
  endDate?: string,
  cleaningFee = 4500,
): number {
  const nights = startDate && endDate ? nightsBetween(startDate, endDate) : 0;
  if (nights === 0) return 0;
  const subtotal = nights * pricePerNight;
  const service = Math.round(subtotal * 0.14);
  return subtotal + cleaningFee + service;
}
