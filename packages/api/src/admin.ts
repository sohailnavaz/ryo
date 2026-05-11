// v2-preview synthetic layer for the maintenance / admin dashboard.
// Real admin data will come from privileged Supabase queries + role gates once admin UI is built
// (see docs/14-admin-ops.md). Until then, these hooks aggregate the same synthetic per-listing data
// produced by ./host.ts so anon visitors can see a plausible operations view without any auth.

import { useQuery } from '@tanstack/react-query';
import { fetchListings } from './listings';
import { fetchHostDashboard, type SyntheticBooking } from './host';

export type AdminStats = {
  total_users: number;
  total_hosts: number;
  total_listings: number;
  pending_moderation: number;
  bookings_30d: number;
  gmv_30d_cents: number;
  gmv_currency: string;
  avg_rating: number;
  active_incidents: number;
};

export type AdminUser = {
  id: string;
  display_name: string;
  email: string;
  role: 'guest' | 'host' | 'concierge' | 'admin';
  joined: string;
  bookings: number;
  status: 'active' | 'suspended';
};

export type AdminModerationItem = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_city: string;
  reason: string;
  submitted_at: string;
  state: 'pending' | 'in_review';
};

export type AdminAuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  reason_code: string;
  created_at: string;
};

export type AdminSystemHealth = {
  api_p95_ms: number;
  search_p95_ms: number;
  email_deliverability_pct: number;
  push_deliverability_pct: number;
  jobs_queue_depth: number;
  webhook_lag_seconds: number;
  uptime_30d_pct: number;
};

const ADMIN_USERS_SEED: AdminUser[] = [
  { id: 'u1', display_name: 'Mira Host',     email: 'host@ryostays.com',       role: 'host',      joined: '2026-01-12', bookings: 0,  status: 'active' },
  { id: 'u2', display_name: 'Alex Patel',    email: 'alex@example.com',        role: 'guest',     joined: '2026-02-04', bookings: 3,  status: 'active' },
  { id: 'u3', display_name: 'Mei Chen',      email: 'mei@example.com',         role: 'guest',     joined: '2026-02-19', bookings: 2,  status: 'active' },
  { id: 'u4', display_name: 'Ravi Sharma',   email: 'ravi@example.com',        role: 'guest',     joined: '2026-03-01', bookings: 5,  status: 'active' },
  { id: 'u5', display_name: 'Lucia Romero',  email: 'lucia@example.com',       role: 'guest',     joined: '2026-03-08', bookings: 1,  status: 'active' },
  { id: 'u6', display_name: 'Naomi Tanaka',  email: 'naomi@ryostays.com',      role: 'concierge', joined: '2026-01-20', bookings: 0,  status: 'active' },
  { id: 'u7', display_name: 'Diego Cruz',    email: 'diego@example.com',       role: 'guest',     joined: '2026-03-22', bookings: 0,  status: 'suspended' },
  { id: 'u8', display_name: 'Aanya Verma',   email: 'aanya@example.com',       role: 'guest',     joined: '2026-04-02', bookings: 1,  status: 'active' },
  { id: 'u9', display_name: 'Sara Khan',     email: 'sara@example.com',        role: 'guest',     joined: '2026-04-12', bookings: 2,  status: 'active' },
  { id: 'u10', display_name: 'Oliver Reed',  email: 'oliver@ryostays.com',     role: 'admin',     joined: '2026-01-08', bookings: 0,  status: 'active' },
];

const MODERATION_SEED_REASONS = [
  'New listing — pending first review',
  'Major edit — capacity changed',
  'Photos flagged for re-review',
  'Address mismatch reported',
  'Re-verification due',
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function fetchAdminDashboard() {
  const all = await fetchListings();
  // Aggregate synthetic bookings across all hosts.
  const hostIds = Array.from(new Set(all.map((l) => l.host_id)));
  const dashboards = await Promise.all(hostIds.map((id) => fetchHostDashboard(id)));
  const bookings: SyntheticBooking[] = dashboards.flatMap((d) => d.bookings);
  const today = todayIso();
  const last30 = addDays(today, -30);

  const last30Bookings = bookings.filter(
    (b) => b.status !== 'cancelled' && b.start_date >= last30 && b.start_date <= today,
  );
  const gmv30Cents = last30Bookings.reduce((s, b) => s + b.total_cents, 0);

  const ratingTotal = all.reduce((s, l) => s + l.rating_avg * l.rating_count, 0);
  const ratingCount = all.reduce((s, l) => s + l.rating_count, 0);

  const stats: AdminStats = {
    total_users: ADMIN_USERS_SEED.length,
    total_hosts: hostIds.length,
    total_listings: all.length,
    pending_moderation: Math.min(5, Math.max(2, Math.floor(all.length * 0.08))),
    bookings_30d: last30Bookings.length,
    gmv_30d_cents: gmv30Cents,
    gmv_currency: all[0]?.currency ?? 'USD',
    avg_rating: ratingCount === 0 ? 0 : ratingTotal / ratingCount,
    active_incidents: 1,
  };

  const moderation: AdminModerationItem[] = all.slice(0, stats.pending_moderation).map((l, i) => ({
    id: `mod-${l.id}`,
    listing_id: l.id,
    listing_title: l.title,
    listing_city: l.city,
    reason: MODERATION_SEED_REASONS[i % MODERATION_SEED_REASONS.length] as string,
    submitted_at: addDays(today, -(i + 1)),
    state: i === 0 ? 'in_review' : 'pending',
  }));

  const recent: SyntheticBooking[] = bookings
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  const audit: AdminAuditEntry[] = [
    { id: 'a1', actor: 'concierge:naomi',  action: 'goodwill_credit',     target: 'booking:b-1923',  reason_code: 'arrival_late_keys', created_at: addDays(today, -1) + 'T09:14Z' },
    { id: 'a2', actor: 'moderator:oliver', action: 'listing_approved',    target: 'listing:l-0042',  reason_code: 'first_review_pass', created_at: addDays(today, -1) + 'T11:32Z' },
    { id: 'a3', actor: 'concierge:naomi',  action: 'rebook_protection',   target: 'booking:b-2014',  reason_code: 'host_cancellation', created_at: addDays(today, -2) + 'T17:48Z' },
    { id: 'a4', actor: 'admin:oliver',     action: 'user_suspended',      target: 'user:u-7',        reason_code: 't_and_s_pattern',   created_at: addDays(today, -3) + 'T08:02Z' },
    { id: 'a5', actor: 'concierge:naomi',  action: 'partial_refund',      target: 'booking:b-1840',  reason_code: 'cleanliness_minor', created_at: addDays(today, -3) + 'T22:11Z' },
    { id: 'a6', actor: 'moderator:oliver', action: 'review_edited',       target: 'review:r-0218',   reason_code: 'off_topic',         created_at: addDays(today, -4) + 'T13:40Z' },
  ];

  const health: AdminSystemHealth = {
    api_p95_ms: 188,
    search_p95_ms: 232,
    email_deliverability_pct: 99.6,
    push_deliverability_pct: 98.9,
    jobs_queue_depth: 14,
    webhook_lag_seconds: 3,
    uptime_30d_pct: 99.97,
  };

  return {
    stats,
    listings: all,
    users: ADMIN_USERS_SEED,
    moderation,
    recent_bookings: recent,
    audit,
    health,
  };
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    staleTime: 60_000,
  });
}
