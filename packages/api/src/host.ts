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

// ---------------------------------------------------------------------------
// Phase A — expanded synthetic surface for the rest of the host site.
// All derived from the same per-listing seed so deep links are stable.
// ---------------------------------------------------------------------------

export type HostBookingsFilter = 'all' | 'upcoming' | 'in_stay' | 'completed' | 'cancelled';

export function useHostBookings(
  hostId: string = DEMO_HOST_ID,
  filter: HostBookingsFilter = 'all',
) {
  return useQuery({
    queryKey: ['host-bookings', hostId, filter],
    queryFn: async () => {
      const d = await fetchHostDashboard(hostId);
      const all = d.bookings;
      const rows =
        filter === 'all' ? all : all.filter((b) => b.status === filter);
      return { bookings: rows, totals: countByStatus(all) };
    },
    staleTime: 60_000,
  });
}

function countByStatus(bookings: SyntheticBooking[]) {
  return {
    all: bookings.length,
    upcoming: bookings.filter((b) => b.status === 'upcoming').length,
    in_stay: bookings.filter((b) => b.status === 'in_stay').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };
}

export type HostBookingDetail = SyntheticBooking & {
  guest_email: string;
  guest_phone: string;
  payout_cents: number;
  payout_date: string;
  cleaning_fee_cents: number;
  service_fee_cents: number;
  events: Array<{ at: string; label: string; actor: string }>;
};

export function useHostBooking(
  hostId: string = DEMO_HOST_ID,
  bookingId: string | undefined,
) {
  return useQuery({
    queryKey: ['host-booking', hostId, bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const d = await fetchHostDashboard(hostId);
      const b = d.bookings.find((x) => x.id === bookingId);
      if (!b) return null;
      const r = rng(hash(b.id));
      const cleaning = Math.round(b.total_cents * 0.08);
      const service = Math.round(b.total_cents * 0.04);
      const payout = Math.round(b.total_cents * 0.85);
      const events: HostBookingDetail['events'] = [
        { at: b.created_at, label: 'Reservation requested', actor: b.guest_name },
        { at: addDays(b.created_at, 0), label: 'Auto-accepted (instant book)', actor: 'system' },
        { at: addDays(b.created_at, 1), label: 'Payment authorised', actor: 'system' },
      ];
      if (b.status === 'in_stay' || b.status === 'completed') {
        events.push({ at: b.start_date, label: 'Guest checked in', actor: b.guest_name });
      }
      if (b.status === 'completed') {
        events.push({ at: b.end_date, label: 'Guest checked out', actor: b.guest_name });
        events.push({
          at: addDays(b.end_date, 1),
          label: `Payout scheduled (${formatPayout(payout, b.currency)})`,
          actor: 'system',
        });
      }
      if (b.status === 'cancelled') {
        events.push({ at: b.created_at, label: 'Booking cancelled', actor: 'guest' });
      }
      const detail: HostBookingDetail = {
        ...b,
        guest_email: `${b.guest_name.split(' ')[0]?.toLowerCase()}@example.com`,
        guest_phone: `+1 555 ${100 + Math.floor(r() * 899)} ${1000 + Math.floor(r() * 8999)}`,
        payout_cents: payout,
        payout_date: addDays(b.end_date, 1),
        cleaning_fee_cents: cleaning,
        service_fee_cents: service,
        events,
      };
      return detail;
    },
    staleTime: 60_000,
  });
}

function formatPayout(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export type HostEarningsPeriod = 'this_month' | 'last_month' | 'ytd';

export type HostEarningsBreakdown = {
  period: HostEarningsPeriod;
  gross_cents: number;
  fees_cents: number;
  net_cents: number;
  bookings: number;
  nights: number;
  currency: string;
  payouts: Array<{
    id: string;
    paid_at: string;
    amount_cents: number;
    status: 'paid' | 'scheduled' | 'failed';
    booking_count: number;
  }>;
  by_listing: Array<{
    listing_id: string;
    listing_title: string;
    bookings: number;
    nights: number;
    gross_cents: number;
    net_cents: number;
  }>;
};

export function useHostEarnings(
  hostId: string = DEMO_HOST_ID,
  period: HostEarningsPeriod = 'this_month',
) {
  return useQuery({
    queryKey: ['host-earnings', hostId, period],
    queryFn: async (): Promise<HostEarningsBreakdown> => {
      const d = await fetchHostDashboard(hostId);
      const today = todayIso();
      const monthStart = today.slice(0, 7) + '-01';
      const prevMonth = addDays(monthStart, -1).slice(0, 7) + '-01';
      const prevMonthEnd = addDays(monthStart, -1);
      const yearStart = today.slice(0, 4) + '-01-01';

      const inRange = (b: SyntheticBooking) => {
        if (b.status === 'cancelled') return false;
        if (period === 'this_month') return b.start_date >= monthStart;
        if (period === 'last_month') return b.start_date >= prevMonth && b.start_date <= prevMonthEnd;
        return b.start_date >= yearStart;
      };

      const rows = d.bookings.filter(inRange);
      const currency = d.listings[0]?.currency ?? 'USD';
      const gross = rows.reduce((s, b) => s + b.total_cents, 0);
      const net = Math.round(gross * 0.85);
      const fees = gross - net;
      const nights = rows.reduce((s, b) => s + b.nights, 0);

      const byListing = d.listings.map((l) => {
        const subset = rows.filter((b) => b.listing_id === l.id);
        const g = subset.reduce((s, b) => s + b.total_cents, 0);
        return {
          listing_id: l.id,
          listing_title: l.title,
          bookings: subset.length,
          nights: subset.reduce((s, b) => s + b.nights, 0),
          gross_cents: g,
          net_cents: Math.round(g * 0.85),
        };
      });

      // 3 most recent payouts.
      const payouts = rows
        .slice()
        .sort((a, b) => b.end_date.localeCompare(a.end_date))
        .slice(0, 3)
        .map((b, i) => ({
          id: `po-${b.id}`,
          paid_at: addDays(b.end_date, 1),
          amount_cents: Math.round(b.total_cents * 0.85),
          status: (i === 0 ? 'scheduled' : 'paid') as 'paid' | 'scheduled' | 'failed',
          booking_count: 1,
        }));

      return {
        period,
        gross_cents: gross,
        fees_cents: fees,
        net_cents: net,
        bookings: rows.length,
        nights,
        currency,
        payouts,
        by_listing: byListing,
      };
    },
    staleTime: 60_000,
  });
}

export type InboxThreadSummary = {
  id: string;
  guest_name: string;
  guest_avatar: string;
  listing_id: string;
  listing_title: string;
  preview: string;
  last_at: string;
  unread: boolean;
};

export type InboxMessage = {
  id: string;
  from: 'guest' | 'host';
  body: string;
  at: string;
};

export type InboxThreadDetail = InboxThreadSummary & {
  booking_id: string;
  start_date: string;
  end_date: string;
  nights: number;
  guests: number;
  messages: InboxMessage[];
};

const THREAD_PREVIEWS = [
  'Hi! Looking forward to the stay — is early check-in possible?',
  'Quick question about the kitchen — is there an espresso machine?',
  'Thanks for the warm welcome — the home is even nicer than the photos.',
  'We arrived safely, the keys worked perfectly. Thank you!',
  'Could we extend by one night? Happy to pay the difference.',
  'Sending a little note — everything was perfect. Will leave a review tomorrow.',
];

const THREAD_REPLIES = [
  'Of course — 12pm works on our end, just let me know when you’re close.',
  'Yes, there’s a Breville on the counter and beans in the cupboard. Enjoy.',
  'Thank you, that means a lot. Let me know if anything comes up.',
  'Wonderful! There’s tea and biscuits in the kitchen — please help yourselves.',
  'Let me check the calendar and get back to you within the hour.',
];

export function useHostInbox(hostId: string = DEMO_HOST_ID) {
  return useQuery({
    queryKey: ['host-inbox', hostId],
    queryFn: async (): Promise<InboxThreadSummary[]> => {
      const d = await fetchHostDashboard(hostId);
      // One thread per upcoming/in-stay booking + one per recent completed.
      const active = d.bookings.filter(
        (b) => b.status === 'upcoming' || b.status === 'in_stay',
      );
      const recent = d.bookings
        .filter((b) => b.status === 'completed')
        .sort((a, b) => b.end_date.localeCompare(a.end_date))
        .slice(0, 2);
      const all = [...active, ...recent];
      return all.map((b, i) => {
        const r = rng(hash(b.id) ^ 0xabcdef);
        return {
          id: `th-${b.id}`,
          guest_name: b.guest_name,
          guest_avatar: b.guest_avatar,
          listing_id: b.listing_id,
          listing_title: b.listing_title,
          preview: THREAD_PREVIEWS[Math.floor(r() * THREAD_PREVIEWS.length)] as string,
          last_at: addDays(todayIso(), -i),
          unread: i < 2,
        };
      });
    },
    staleTime: 60_000,
  });
}

export function useHostInboxThread(
  hostId: string = DEMO_HOST_ID,
  threadId: string | undefined,
) {
  return useQuery({
    queryKey: ['host-inbox-thread', hostId, threadId],
    enabled: !!threadId,
    queryFn: async (): Promise<InboxThreadDetail | null> => {
      if (!threadId) return null;
      const d = await fetchHostDashboard(hostId);
      const bookingId = threadId.replace(/^th-/, '');
      const b = d.bookings.find((x) => x.id === bookingId);
      if (!b) return null;
      const r = rng(hash(threadId));
      const msgCount = 3 + Math.floor(r() * 4);
      const messages: InboxMessage[] = [];
      for (let i = 0; i < msgCount; i++) {
        const from = i % 2 === 0 ? 'guest' : 'host';
        const body =
          from === 'guest'
            ? (THREAD_PREVIEWS[Math.floor(r() * THREAD_PREVIEWS.length)] as string)
            : (THREAD_REPLIES[Math.floor(r() * THREAD_REPLIES.length)] as string);
        messages.push({
          id: `${threadId}-m${i}`,
          from,
          body,
          at: addDays(todayIso(), -(msgCount - i)),
        });
      }
      return {
        id: threadId,
        booking_id: b.id,
        guest_name: b.guest_name,
        guest_avatar: b.guest_avatar,
        listing_id: b.listing_id,
        listing_title: b.listing_title,
        preview: messages[messages.length - 1]?.body ?? '',
        last_at: messages[messages.length - 1]?.at ?? todayIso(),
        unread: false,
        start_date: b.start_date,
        end_date: b.end_date,
        nights: b.nights,
        guests: 1 + Math.floor(r() * 4),
        messages,
      };
    },
    staleTime: 60_000,
  });
}

export type HostReviewsData = {
  reviews: SyntheticReview[];
  by_month: Array<{ month: string; avg: number; count: number }>;
  average: number;
  total: number;
};

export function useHostReviews(hostId: string = DEMO_HOST_ID) {
  return useQuery({
    queryKey: ['host-reviews', hostId],
    queryFn: async (): Promise<HostReviewsData> => {
      const d = await fetchHostDashboard(hostId);
      const reviews = d.reviews;
      // Bucket by month for the trend chart (last 6 months).
      const buckets = new Map<string, { sum: number; count: number }>();
      for (const rv of reviews) {
        const m = rv.created_at.slice(0, 7);
        const cur = buckets.get(m) ?? { sum: 0, count: 0 };
        cur.sum += rv.rating;
        cur.count += 1;
        buckets.set(m, cur);
      }
      const months = Array.from(buckets.keys()).sort().slice(-6);
      const byMonth = months.map((m) => {
        const b = buckets.get(m)!;
        return { month: m, avg: b.sum / b.count, count: b.count };
      });
      const total = reviews.length;
      const avg = total === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / total;
      return { reviews, by_month: byMonth, average: avg, total };
    },
    staleTime: 60_000,
  });
}

export function useHostListings(hostId: string = DEMO_HOST_ID) {
  return useQuery({
    queryKey: ['host-listings', hostId],
    queryFn: async () => {
      const d = await fetchHostDashboard(hostId);
      return d.listings;
    },
    staleTime: 60_000,
  });
}

export function useHostListing(
  hostId: string = DEMO_HOST_ID,
  listingId: string | undefined,
) {
  return useQuery({
    queryKey: ['host-listing', hostId, listingId],
    enabled: !!listingId,
    queryFn: async () => {
      const d = await fetchHostDashboard(hostId);
      const l = d.listings.find((x) => x.id === listingId);
      if (!l) return null;
      const bookings = d.bookings.filter((b) => b.listing_id === listingId);
      const reviews = d.reviews.filter((r) => r.listing_id === listingId);
      return { listing: l, bookings, reviews };
    },
    staleTime: 60_000,
  });
}

// Calendar — produce a per-day status for the next 60 days across all host listings.
export type CalendarDay = {
  date: string;
  listing_id: string;
  state: 'available' | 'booked' | 'blocked';
  price_cents: number;
  booking_id?: string;
  guest_name?: string;
};

export function useHostCalendar(hostId: string = DEMO_HOST_ID, days = 60) {
  return useQuery({
    queryKey: ['host-calendar', hostId, days],
    queryFn: async () => {
      const d = await fetchHostDashboard(hostId);
      const today = todayIso();
      const out: CalendarDay[] = [];
      for (const l of d.listings) {
        const r = rng(hash(l.id) ^ 0xfeedf00d);
        for (let i = 0; i < days; i++) {
          const date = addDays(today, i);
          const booking = d.bookings.find(
            (b) =>
              b.listing_id === l.id &&
              b.status !== 'cancelled' &&
              date >= b.start_date &&
              date < b.end_date,
          );
          let state: CalendarDay['state'] = booking ? 'booked' : 'available';
          if (!booking && r() < 0.06) state = 'blocked';
          out.push({
            date,
            listing_id: l.id,
            state,
            price_cents: l.price_cents,
            booking_id: booking?.id,
            guest_name: booking?.guest_name,
          });
        }
      }
      return { listings: d.listings, days: out };
    },
    staleTime: 60_000,
  });
}
