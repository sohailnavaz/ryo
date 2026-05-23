import { nightsBetween } from './dates';

/**
 * Single source of truth for booking price math.
 *
 * Flow: nights → base subtotal → length-of-stay discount → cleaning fee →
 * service fee → taxes → total, with every line returned as a structured
 * breakdown so the UI never has to reverse-engineer the total.
 *
 * All money is in integer cents. All callers (PriceTotal, BookingScreen,
 * TripDetailScreen, computeBookingTotal) go through `computePricing` — there is
 * no ad-hoc pricing math anywhere else.
 */

export type GuestCounts = {
  adults: number;
  children: number;
  infants: number;
  pets: number;
};

/** A fresh booking starts with one adult. */
export const EMPTY_GUESTS: GuestCounts = { adults: 1, children: 0, infants: 0, pets: 0 };

/**
 * Only adults + children count toward a listing's `max_guests`. Infants and
 * pets are tracked for the host but don't consume capacity.
 */
export function billableGuests(g: Pick<GuestCounts, 'adults' | 'children'>): number {
  return g.adults + g.children;
}

/** Length-of-stay discount tiers, evaluated longest-first. */
export const STAY_DISCOUNTS = [
  { minNights: 28, rate: 0.2, label: 'Monthly discount' },
  { minNights: 7, rate: 0.1, label: 'Weekly discount' },
] as const;

export function stayDiscount(nights: number): { rate: number; label: string | null } {
  for (const tier of STAY_DISCOUNTS) {
    if (nights >= tier.minNights) return { rate: tier.rate, label: tier.label };
  }
  return { rate: 0, label: null };
}

export type PricingConfig = {
  cleaningFeeCents: number;
  serviceFeeRate: number;
  taxRate: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  cleaningFeeCents: 4500,
  serviceFeeRate: 0.14,
  taxRate: 0.05,
};

export type PricingInput = {
  pricePerNightCents: number;
  /** Provide nights directly, or `startDate`/`endDate` to derive them. */
  nights?: number;
  startDate?: string;
  endDate?: string;
  config?: Partial<PricingConfig>;
};

export type PriceBreakdown = {
  nights: number;
  nightlyCents: number;
  /** nights × nightly, before any discount. */
  baseSubtotalCents: number;
  /** Amount removed by the length-of-stay discount (>= 0). */
  discountCents: number;
  discountRate: number;
  discountLabel: string | null;
  /** Lodging base after discount — what cleaning/service/tax build on. */
  subtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  taxesCents: number;
  totalCents: number;
};

const ZERO: Omit<PriceBreakdown, 'nightlyCents'> = {
  nights: 0,
  baseSubtotalCents: 0,
  discountCents: 0,
  discountRate: 0,
  discountLabel: null,
  subtotalCents: 0,
  cleaningFeeCents: 0,
  serviceFeeCents: 0,
  taxesCents: 0,
  totalCents: 0,
};

export function computePricing(input: PricingInput): PriceBreakdown {
  const cfg = { ...DEFAULT_PRICING, ...input.config };
  const nightlyCents = Math.max(0, Math.round(input.pricePerNightCents));
  const nights =
    input.nights ??
    (input.startDate && input.endDate ? nightsBetween(input.startDate, input.endDate) : 0);

  if (nights <= 0) return { ...ZERO, nightlyCents };

  const baseSubtotalCents = nightlyCents * nights;
  const { rate: discountRate, label } = stayDiscount(nights);
  const discountCents = Math.round(baseSubtotalCents * discountRate);
  const subtotalCents = baseSubtotalCents - discountCents;
  const cleaningFeeCents = cfg.cleaningFeeCents;
  const serviceFeeCents = Math.round((subtotalCents + cleaningFeeCents) * cfg.serviceFeeRate);
  const taxesCents = Math.round(
    (subtotalCents + cleaningFeeCents + serviceFeeCents) * cfg.taxRate,
  );
  const totalCents = subtotalCents + cleaningFeeCents + serviceFeeCents + taxesCents;

  return {
    nights,
    nightlyCents,
    baseSubtotalCents,
    discountCents,
    discountRate,
    discountLabel: discountCents > 0 ? label : null,
    subtotalCents,
    cleaningFeeCents,
    serviceFeeCents,
    taxesCents,
    totalCents,
  };
}
