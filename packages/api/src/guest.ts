// v2-preview / dev synthetic layer for the guest "Account" dashboard.
// Mirrors the same pattern as ./host.ts and ./admin.ts:
//   - When Supabase is wired AND the user is signed in → real bookings + favourites
//   - Otherwise → synthetic demo derived deterministically from the dummy listings,
//     and `isPreview: true` so the UI can show a banner.
//
// This keeps the dashboard demoable for anon visitors in dev without leaking
// fake data into a real signed-in user's view.

import { useQuery } from '@tanstack/react-query';
import type { Listing } from '@bnb/db';
import { getSupabase } from './client';
import { DUMMY_LISTINGS } from './dummy-listings';
import { getDemoUser, useDemoUser } from './demo-auth';

export type GuestBooking = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_city: string;
  listing_country: string;
  listing_photo: string | null;
  start_date: string;
  end_date: string;
  nights: number;
  total_cents: number;
  currency: string;
  host_name: string;
  status: 'upcoming' | 'in_stay' | 'completed' | 'cancelled';
};

export type GuestStats = {
  upcoming_trips: number;
  in_stay: number;
  past_trips: number;
  favourites: number;
  unread_messages: number; // always 0 until messaging ships (v2)
};

export type GuestDashboard = {
  user: {
    id: string | null;
    display_name: string;
    email: string | null;
    avatar_url: string | null;
  };
  bookings: GuestBooking[];
  favourites: Listing[];
  stats: GuestStats;
  isPreview: boolean; // true → show preview banner
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function listingPhoto(l: Listing): string | null {
  return (l.photos ?? []).slice().sort((a, b) => a.position - b.position)[0]?.url ?? null;
}

// FNV-1a / LCG (same primitives as ./host.ts — kept local to avoid circular import)
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function syntheticBookings(seed: number): GuestBooking[] {
  const r = rng(seed);
  const today = todayIso();
  const pool = DUMMY_LISTINGS.slice().sort(() => r() - 0.5);
  const out: GuestBooking[] = [];

  // One in-stay (50%)
  if (r() < 0.5) {
    const l = pool[0]!;
    const nights = 3 + Math.floor(r() * 4);
    const start = addDays(today, -Math.floor(r() * (nights - 1)));
    const end = addDays(start, nights);
    out.push({
      id: `g-in-${l.id}`,
      listing_id: l.id, listing_title: l.title,
      listing_city: l.city, listing_country: l.country,
      listing_photo: listingPhoto(l),
      start_date: start, end_date: end, nights,
      total_cents: l.price_cents * nights, currency: l.currency,
      host_name: 'Mira Host', status: 'in_stay',
    });
  }

  // Upcoming (1-2)
  for (let i = 0; i < 1 + Math.floor(r() * 2); i++) {
    const l = pool[(i + 1) % pool.length]!;
    const offset = 7 + Math.floor(r() * 70);
    const nights = 2 + Math.floor(r() * 5);
    const start = addDays(today, offset);
    const end = addDays(start, nights);
    out.push({
      id: `g-up-${l.id}`,
      listing_id: l.id, listing_title: l.title,
      listing_city: l.city, listing_country: l.country,
      listing_photo: listingPhoto(l),
      start_date: start, end_date: end, nights,
      total_cents: l.price_cents * nights, currency: l.currency,
      host_name: 'Mira Host', status: 'upcoming',
    });
  }

  // Past completed (2-3)
  for (let i = 0; i < 2 + Math.floor(r() * 2); i++) {
    const l = pool[(i + 3) % pool.length]!;
    const offsetEnd = -(14 + Math.floor(r() * 180));
    const nights = 2 + Math.floor(r() * 5);
    const end = addDays(today, offsetEnd);
    const start = addDays(end, -nights);
    out.push({
      id: `g-done-${l.id}`,
      listing_id: l.id, listing_title: l.title,
      listing_city: l.city, listing_country: l.country,
      listing_photo: listingPhoto(l),
      start_date: start, end_date: end, nights,
      total_cents: l.price_cents * nights, currency: l.currency,
      host_name: 'Mira Host', status: 'completed',
    });
  }

  return out.sort((a, b) => a.start_date.localeCompare(b.start_date));
}

function statsFor(bookings: GuestBooking[], favourites: Listing[]): GuestStats {
  return {
    upcoming_trips: bookings.filter((b) => b.status === 'upcoming').length,
    in_stay: bookings.filter((b) => b.status === 'in_stay').length,
    past_trips: bookings.filter((b) => b.status === 'completed').length,
    favourites: favourites.length,
    unread_messages: 0,
  };
}

async function tryFetchSignedInDashboard(): Promise<GuestDashboard | null> {
  let supabase;
  try {
    supabase = getSupabase();
  } catch {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [bookingsRes, favouritesRes] = await Promise.all([
    supabase
      .from('bookings')
      .select(
        `id, listing_id, start_date, end_date, total_cents, status,
         listing:listings ( id, title, city, country, photos:listing_photos ( id, listing_id, url, position ) )`,
      )
      .eq('guest_id', user.id)
      .order('start_date', { ascending: false }),
    supabase
      .from('favorites')
      .select(`
        listing:listings (
          id, host_id, title, description, price_cents, currency, property_type,
          bedrooms, bathrooms, max_guests, address, city, country, lat, lng,
          amenities, rating_avg, rating_count, created_at,
          photos:listing_photos ( id, listing_id, url, position )
        )
      `)
      .eq('user_id', user.id),
  ]);

  if (bookingsRes.error) throw bookingsRes.error;
  if (favouritesRes.error) throw favouritesRes.error;

  const today = todayIso();
  type RawBooking = {
    id: string; listing_id: string; start_date: string; end_date: string;
    total_cents: number; status: string;
    listing?: { id: string; title: string; city: string; country: string; photos?: { url: string; position: number }[] };
  };
  const bookings: GuestBooking[] = (bookingsRes.data as unknown as RawBooking[] ?? []).map((b) => {
    const photos = (b.listing?.photos ?? []).slice().sort((a, b) => a.position - b.position);
    const nights = Math.max(1, Math.round((+new Date(b.end_date) - +new Date(b.start_date)) / 86_400_000));
    let status: GuestBooking['status'];
    if (b.status === 'cancelled') status = 'cancelled';
    else if (b.end_date < today) status = 'completed';
    else if (b.start_date <= today && b.end_date >= today) status = 'in_stay';
    else status = 'upcoming';
    return {
      id: b.id,
      listing_id: b.listing_id,
      listing_title: b.listing?.title ?? 'Stay',
      listing_city: b.listing?.city ?? '',
      listing_country: b.listing?.country ?? '',
      listing_photo: photos[0]?.url ?? null,
      start_date: b.start_date, end_date: b.end_date, nights,
      total_cents: b.total_cents, currency: 'USD',
      host_name: 'Host', status,
    };
  });

  const favourites: Listing[] = ((favouritesRes.data ?? []) as unknown as { listing: Listing }[])
    .map((r) => r.listing)
    .filter(Boolean)
    .map((l) => ({ ...l, photos: (l.photos ?? []).slice().sort((a, b) => a.position - b.position) }));

  return {
    user: {
      id: user.id,
      display_name:
        (user.user_metadata?.['full_name'] as string | undefined) ??
        user.email?.split('@')[0] ??
        'Guest',
      email: user.email ?? null,
      avatar_url: (user.user_metadata?.['avatar_url'] as string | undefined) ?? null,
    },
    bookings,
    favourites,
    stats: statsFor(bookings, favourites),
    isPreview: false,
  };
}

function previewDashboard(): GuestDashboard {
  const demo = getDemoUser();
  const seed = hash(demo?.id ?? 'ryo-guest-preview');
  const bookings = syntheticBookings(seed);
  const r = rng(seed ^ 0x5a17ab1e);
  const favourites = DUMMY_LISTINGS.slice().sort(() => r() - 0.5).slice(0, 4);
  return {
    user: demo
      ? {
          id: demo.id,
          display_name: demo.full_name,
          email: demo.email,
          avatar_url: demo.avatar_url ?? null,
        }
      : {
          id: null,
          display_name: 'Guest',
          email: null,
          avatar_url: null,
        },
    bookings,
    favourites,
    stats: statsFor(bookings, favourites),
    isPreview: true,
  };
}

export async function fetchGuestDashboard(): Promise<GuestDashboard> {
  const signedIn = await tryFetchSignedInDashboard();
  return signedIn ?? previewDashboard();
}

export function useGuestDashboard() {
  const demo = useDemoUser();
  return useQuery({
    // Including the demo id forces a refetch when the demo identity changes
    // (sign-in / sign-out as Mira). Real signed-in users follow a separate
    // path inside fetchGuestDashboard and don't depend on this key.
    queryKey: ['guest-dashboard', demo?.id ?? 'anon'],
    queryFn: fetchGuestDashboard,
    staleTime: 30_000,
  });
}
