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
};

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
