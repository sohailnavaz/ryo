import { View } from 'react-native';
import { computePricing, formatPrice, type PriceBreakdown } from '@bnb/utils';
import { Divider } from './Divider';
import { Text } from './Text';

export type PriceTotalProps = {
  /** Per-night price in cents. Ignored when `breakdown` is supplied. */
  pricePerNight?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  /** Override the default cleaning fee (cents). Ignored when `breakdown` is supplied. */
  cleaningFee?: number;
  /** Render a precomputed breakdown instead of deriving one from the props above. */
  breakdown?: PriceBreakdown;
};

/**
 * Renders the structured price breakdown produced by the shared pricing engine
 * (`@bnb/utils → computePricing`). Either pass a precomputed `breakdown`, or
 * pass `pricePerNight` + dates and let the component compute it. There is no
 * pricing math in this component — it only formats lines.
 */
export function PriceTotal({
  pricePerNight = 0,
  currency = 'USD',
  startDate,
  endDate,
  cleaningFee,
  breakdown,
}: PriceTotalProps) {
  const b =
    breakdown ??
    computePricing({
      pricePerNightCents: pricePerNight,
      startDate,
      endDate,
      config: cleaningFee != null ? { cleaningFeeCents: cleaningFee } : undefined,
    });

  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <Text className="underline">
          {formatPrice(b.nightlyCents, currency)} × {b.nights} {b.nights === 1 ? 'night' : 'nights'}
        </Text>
        <Text>{formatPrice(b.baseSubtotalCents, currency)}</Text>
      </View>

      {b.nights > 0 ? (
        <>
          {b.discountCents > 0 ? (
            <View className="flex-row justify-between">
              <Text className="text-brand-600">{b.discountLabel}</Text>
              <Text className="text-brand-600">−{formatPrice(b.discountCents, currency)}</Text>
            </View>
          ) : null}
          <View className="flex-row justify-between">
            <Text className="underline">Cleaning fee</Text>
            <Text>{formatPrice(b.cleaningFeeCents, currency)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="underline">Service fee</Text>
            <Text>{formatPrice(b.serviceFeeCents, currency)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="underline">Taxes</Text>
            <Text>{formatPrice(b.taxesCents, currency)}</Text>
          </View>
        </>
      ) : null}

      <Divider className="my-2" />
      <View className="flex-row justify-between">
        <Text className="font-semibold">Total</Text>
        <Text className="font-semibold">{formatPrice(b.totalCents, currency)}</Text>
      </View>
    </View>
  );
}

/** Total price in cents for a stay. Thin wrapper over the shared pricing engine. */
export function computeBookingTotal(
  pricePerNight: number,
  startDate?: string,
  endDate?: string,
  cleaningFee?: number,
): number {
  return computePricing({
    pricePerNightCents: pricePerNight,
    startDate,
    endDate,
    config: cleaningFee != null ? { cleaningFeeCents: cleaningFee } : undefined,
  }).totalCents;
}
