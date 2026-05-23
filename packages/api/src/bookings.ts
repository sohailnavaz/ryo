import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking, Listing } from '@bnb/db';
import { getSupabase, tryGetSupabase } from './client';

type TripRow = Booking & { listing: Pick<Listing, 'id' | 'title' | 'city' | 'country' | 'photos'> };

export async function fetchMyBookings(): Promise<TripRow[]> {
  const supabase = tryGetSupabase();
  if (!supabase) return []; // Supabase not configured → empty trips list
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `id, listing_id, guest_id, start_date, end_date, total_cents, status, created_at,
       listing:listings ( id, title, city, country, photos:listing_photos ( id, url, position ) )`,
    )
    .eq('guest_id', user.id)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as TripRow[];
}

export function useMyBookings() {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: fetchMyBookings,
    staleTime: 30_000,
  });
}

export type CreateBookingInput = {
  listing_id: string;
  start_date: string;
  end_date: string;
  total_cents: number;
  // Guest party (capacity = adults + children ≤ listing.max_guests).
  adults: number;
  children: number;
  infants: number;
  pets: number;
  // Structured price breakdown, written verbatim from the shared pricing engine.
  subtotal_cents: number;
  cleaning_fee_cents: number;
  service_fee_cents: number;
  taxes_cents: number;
  discount_cents: number;
};

/** A privacy-safe booked date range for a listing — no guest identity. */
export type BookedRange = { start_date: string; end_date: string };

// --- synthetic availability (until the `listing_booked_ranges` RPC ships) ---
// Deterministic per-listing so the live-availability calendar demos sensibly in
// the unconfigured dev / preview environment. Mirrors the hash+LCG primitives
// used in guest.ts / host.ts. Removed once L1 lands the RPC + bookings have real
// rows to read.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function lcg(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function isoAddDays(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function syntheticBookedRanges(listingId: string): BookedRange[] {
  const r = lcg(hashStr(listingId));
  const today = new Date();
  const out: BookedRange[] = [];
  let cursor = 3 + Math.floor(r() * 6);
  for (let i = 0; i < 3; i++) {
    const len = 2 + Math.floor(r() * 4);
    const start = isoAddDays(today, cursor);
    const end = isoAddDays(today, cursor + len);
    out.push({ start_date: start, end_date: end });
    cursor += len + 4 + Math.floor(r() * 12);
  }
  return out;
}

export async function fetchListingBookedRanges(listingId: string): Promise<BookedRange[]> {
  const supabase = tryGetSupabase();
  if (!supabase) return syntheticBookedRanges(listingId);
  // Privacy-safe RPC (L1 migration): returns only date ranges, no guest data.
  const { data, error } = await supabase.rpc('listing_booked_ranges', {
    p_listing_id: listingId,
  });
  // RPC not deployed yet → fail soft to synthetic so the calendar still demos.
  if (error) return syntheticBookedRanges(listingId);
  return (data ?? []) as BookedRange[];
}

/** Booked date ranges for a listing, for greying-out the availability calendar. */
export function useListingBookedRanges(listingId: string | undefined) {
  return useQuery({
    queryKey: ['listing-booked-ranges', listingId],
    queryFn: () => fetchListingBookedRanges(listingId!),
    enabled: !!listingId,
    staleTime: 60_000,
  });
}

/** Full booking row including the stored breakdown + guest counts. */
export type BookingDetail = Booking & {
  adults: number | null;
  children: number | null;
  infants: number | null;
  pets: number | null;
  subtotal_cents: number | null;
  cleaning_fee_cents: number | null;
  service_fee_cents: number | null;
  taxes_cents: number | null;
  discount_cents: number | null;
};

export async function fetchBooking(bookingId: string): Promise<BookingDetail | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('guest_id', user.id)
    .maybeSingle();
  // Pre-migration the breakdown columns don't exist → `select *` still returns the
  // base row; an error (or no row) just means "no rich detail", so fall back.
  if (error) return null;
  return (data as BookingDetail | null) ?? null;
}

/** Rich detail for one of the current user's bookings. Synthetic preview ids
 *  (prefixed `g-`) have no real row, so the query stays disabled for them. */
export function useBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBooking(bookingId!),
    enabled: !!bookingId && !bookingId.startsWith('g-'),
    staleTime: 30_000,
  });
}

/** Postgres exclusion_violation code emitted by the `bookings_no_overlap` constraint. */
export const BOOKING_DATES_TAKEN_CODE = '23P01';

/** Error thrown by `useCreateBooking` when the requested dates were taken by another
 *  guest in the moment between availability-check and insert. UI should catch this
 *  and surface a clear message rather than the raw Postgres error. */
export class BookingDatesTakenError extends Error {
  constructor() {
    super('Those dates just got booked by someone else. Please pick different dates.');
    this.name = 'BookingDatesTakenError';
  }
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('bookings')
        .insert({ ...input, guest_id: user.id, status: 'confirmed' })
        .select('*')
        .single();
      if (error) {
        // Postgres exclusion violation from `bookings_no_overlap` (migration 0002).
        // Translate to a typed error the UI knows how to render.
        const code = (error as { code?: string }).code;
        if (code === BOOKING_DATES_TAKEN_CODE) throw new BookingDatesTakenError();
        throw error;
      }
      return data as Booking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

/** Cancel one of the current user's bookings.
 *
 *  v1: any future booking can be cancelled by its guest. Real cancellation-policy
 *  refund logic (per `docs/05-bookings.md §4.4`) lands when payments are real. The
 *  mutation only flips `status` to `'cancelled'`; the booking row is preserved for
 *  history.
 */
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('guest_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}
