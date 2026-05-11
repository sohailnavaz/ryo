// v2-preview synthetic layer.
// Real host data will come from Supabase queries + RLS once host UI is built (see docs/13-host-tools.md).
// Until then, these hooks derive plausible bookings/earnings/reviews deterministically from listing IDs
// so the dashboard works for any anon visitor without auth or schema changes.

import { useQuery } from '@tanstack/react-query';
import type { Listing } from '@bnb/db';
import { fetchListings } from './listings';

export const DEMO_HOST_ID = '11111111-1111-1111-1111-111111111111';

export type SyntheticBooking = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_city: string;
  listing_country: string;
  listing_photo: string | null;
  guest_name: string;
  guest_avatar: string;
  start_date: string;
  end_date: string;
  nights: number;
  total_cents: number;
  currency: string;
  status: 'upcoming' | 'in_stay' | 'completed' | 'cancelled';
  created_at: string;
};

export type SyntheticReview = {
  id: string;
  listing_id: string;
  listing_title: string;
  guest_name: string;
  guest_avatar: string;
  rating: number;
  body: string;
  created_at: string;
};

export type HostStats = {
  active_listings: number;
  upcoming_bookings: number;
  in_stay_bookings: number;
  this_month_bookings: number;
  this_month_earnings_cents: number;
  ytd_earnings_cents: number;
  rating_avg: number;
  rating_count: number;
  occupancy_rate: number;
  response_rate: number;
  acceptance_rate: number;
};

const GUESTS = [
  { name: 'Alex Patel', avatar: 'photo-1494790108377-be9c29b29330' },
  { name: 'Mei Chen', avatar: 'photo-1535713875002-d1d0cf377fde' },
  { name: 'Ravi Sharma', avatar: 'photo-1599566150163-29194dcaad36' },
  { name: 'Sara Khan', avatar: 'photo-1438761681033-6461ffad8d80' },
  { name: 'Tom Lee', avatar: 'photo-1564564321837-a57b7070ac4f' },
  { name: 'Jin Park', avatar: 'photo-1500648767791-00dcc994a43e' },
  { name: 'Yuki Sato', avatar: 'photo-1507003211169-0a1dd7228f2d' },
  { name: 'Lucia Romero', avatar: 'photo-1517841905240-472988babdf9' },
  { name: 'Ethan Brown', avatar: 'photo-1506794778202-cad84cf45f1d' },
  { name: 'Aanya Verma', avatar: 'photo-1531123897727-8f129e1688ce' },
] as const;

const REVIEW_LINES = [
  'Exactly as described. Stunning sunsets, immaculate kitchen, and the host left local tea — small touches matter.',
  'Quiet, comfortable, and the bed was the best part of the trip. We would book again without thinking.',
  'Spotless on arrival. Host responded in minutes whenever we had a question. Hard to fault.',
  'Photos do not do it justice. The light in the morning is something else.',
  'Great location, generous amenities, and the cleaning was hotel-grade. Five stars without hesitation.',
  'Calm, simple, well-considered. Felt like coming home after a long day rather than checking into a rental.',
  'A few minor things to flag for the host but overall a lovely stay — the view alone earns the price.',
];

// FNV-1a 32-bit
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

function pick<T>(arr: readonly T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)] as T;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function unsplash(id: string, w = 200) {
  return `https://images.unsplash.com/${id}?w=${w}&q=80`;
}

function bookingsForListing(l: Listing, today: string): SyntheticBooking[] {
  const r = rng(hash(l.id));
  const photo = (l.photos ?? []).slice().sort((a, b) => a.position - b.position)[0]?.url ?? null;
  const out: SyntheticBooking[] = [];

  // 0–2 upcoming, 1–2 in-stay candidates, 2–3 completed
  const upcomingCount = Math.floor(r() * 3); // 0, 1, 2
  const completedCount = 2 + Math.floor(r() * 2); // 2, 3

  for (let i = 0; i < upcomingCount; i++) {
    const offset = 2 + Math.floor(r() * 60); // 2–62 days out
    const nights = 2 + Math.floor(r() * 6);
    const start = addDays(today, offset);
    const end = addDays(start, nights);
    const guest = pick(GUESTS, r);
    out.push({
      id: `${l.id}-up-${i}`,
      listing_id: l.id,
      listing_title: l.title,
      listing_city: l.city,
      listing_country: l.country,
      listing_photo: photo,
      guest_name: guest.name,
      guest_avatar: unsplash(guest.avatar, 96),
      start_date: start,
      end_date: end,
      nights,
      total_cents: l.price_cents * nights,
      currency: l.currency,
      status: 'upcoming',
      created_at: addDays(today, -Math.floor(r() * 14)),
    });
  }

  // ~30% chance one is currently in-stay
  if (r() < 0.3) {
    const nights = 3 + Math.floor(r() * 5);
    const start = addDays(today, -Math.floor(r() * (nights - 1)));
    const end = addDays(start, nights);
    const guest = pick(GUESTS, r);
    out.push({
      id: `${l.id}-in-0`,
      listing_id: l.id,
      listing_title: l.title,
      listing_city: l.city,
      listing_country: l.country,
      listing_photo: photo,
      guest_name: guest.name,
      guest_avatar: unsplash(guest.avatar, 96),
      start_date: start,
      end_date: end,
      nights,
      total_cents: l.price_cents * nights,
      currency: l.currency,
      status: 'in_stay',
      created_at: addDays(today, -Math.floor(r() * 30) - nights),
    });
  }

  for (let i = 0; i < completedCount; i++) {
    const offsetEnd = -(5 + Math.floor(r() * 90)); // 5–95 days ago
    const nights = 2 + Math.floor(r() * 6);
    const end = addDays(today, offsetEnd);
    const start = addDays(end, -nights);
    const guest = pick(GUESTS, r);
    out.push({
      id: `${l.id}-done-${i}`,
      listing_id: l.id,
      listing_title: l.title,
      listing_city: l.city,
      listing_country: l.country,
      listing_photo: photo,
      guest_name: guest.name,
      guest_avatar: unsplash(guest.avatar, 96),
      start_date: start,
      end_date: end,
      nights,
      total_cents: l.price_cents * nights,
      currency: l.currency,
      status: 'completed',
      created_at: addDays(start, -Math.floor(r() * 21) - 1),
    });
  }

  // 5% chance one cancelled
  if (r() < 0.05) {
    const offset = 10 + Math.floor(r() * 30);
    const nights = 2 + Math.floor(r() * 4);
    const start = addDays(today, offset);
    const end = addDays(start, nights);
    const guest = pick(GUESTS, r);
    out.push({
      id: `${l.id}-cx-0`,
      listing_id: l.id,
      listing_title: l.title,
      listing_city: l.city,
      listing_country: l.country,
      listing_photo: photo,
      guest_name: guest.name,
      guest_avatar: unsplash(guest.avatar, 96),
      start_date: start,
      end_date: end,
      nights,
      total_cents: l.price_cents * nights,
      currency: l.currency,
      status: 'cancelled',
      created_at: addDays(today, -Math.floor(r() * 14)),
    });
  }

  return out;
}

function reviewsForListing(l: Listing): SyntheticReview[] {
  const r = rng(hash(l.id) ^ 0x9e3779b1);
  const count = Math.min(l.rating_count, 3);
  const out: SyntheticReview[] = [];
  for (let i = 0; i < count; i++) {
    const guest = pick(GUESTS, r);
    out.push({
      id: `${l.id}-rv-${i}`,
      listing_id: l.id,
      listing_title: l.title,
      guest_name: guest.name,
      guest_avatar: unsplash(guest.avatar, 96),
      rating: r() < 0.7 ? 5 : 4,
      body: pick(REVIEW_LINES, r),
      created_at: addDays(todayIso(), -Math.floor(r() * 120) - 1),
    });
  }
  return out;
}

function statsFor(listings: Listing[], bookings: SyntheticBooking[]): HostStats {
  const today = todayIso();
  const monthStart = today.slice(0, 7) + '-01';
  const yearStart = today.slice(0, 4) + '-01-01';

  const upcoming = bookings.filter((b) => b.status === 'upcoming').length;
  const inStay = bookings.filter((b) => b.status === 'in_stay').length;

  const thisMonth = bookings.filter(
    (b) => b.status !== 'cancelled' && b.start_date >= monthStart,
  );
  const ytd = bookings.filter(
    (b) => b.status !== 'cancelled' && b.start_date >= yearStart,
  );

  const ratingTotal = listings.reduce((s, l) => s + l.rating_avg * l.rating_count, 0);
  const ratingCount = listings.reduce((s, l) => s + l.rating_count, 0);

  // Occupancy = nights booked in last 30d / (active listings × 30)
  const last30 = addDays(today, -30);
  const nightsBooked = bookings
    .filter((b) => b.status !== 'cancelled' && b.end_date >= last30 && b.start_date <= today)
    .reduce((s, b) => s + b.nights, 0);
  const occCapacity = Math.max(1, listings.length * 30);
  const occRate = Math.min(1, nightsBooked / occCapacity);

  return {
    active_listings: listings.length,
    upcoming_bookings: upcoming,
    in_stay_bookings: inStay,
    this_month_bookings: thisMonth.length,
    this_month_earnings_cents: Math.round(
      thisMonth.reduce((s, b) => s + b.total_cents, 0) * 0.85,
    ),
    ytd_earnings_cents: Math.round(ytd.reduce((s, b) => s + b.total_cents, 0) * 0.85),
    rating_avg: ratingCount === 0 ? 0 : ratingTotal / ratingCount,
    rating_count: ratingCount,
    occupancy_rate: occRate,
    response_rate: 0.97,
    acceptance_rate: 0.94,
  };
}

export async function fetchHostDashboard(hostId: string) {
  const all = await fetchListings();
  const listings = all.filter((l) => l.host_id === hostId);
  const today = todayIso();
  const bookings = listings.flatMap((l) => bookingsForListing(l, today));
  const reviews = listings.flatMap((l) => reviewsForListing(l));
  bookings.sort((a, b) => a.start_date.localeCompare(b.start_date));
  reviews.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const stats = statsFor(listings, bookings);
  return { hostId, listings, bookings, reviews, stats };
}

export function useHostDashboard(hostId: string = DEMO_HOST_ID) {
  return useQuery({
    queryKey: ['host-dashboard', hostId],
    queryFn: () => fetchHostDashboard(hostId),
    staleTime: 60_000,
  });
}
