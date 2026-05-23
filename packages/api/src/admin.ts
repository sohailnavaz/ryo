// v2-preview synthetic layer for the maintenance / admin dashboard.
// Real admin data will come from privileged Supabase queries + role gates once admin UI is built
// (see docs/14-admin-ops.md). Until then, these hooks aggregate the same synthetic per-listing data
// produced by ./host.ts so anon visitors can see a plausible operations view without any auth.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tryGetSupabase } from './client';
import { fetchListings } from './listings';
import { fetchHostDashboard, type SyntheticBooking } from './host';
import {
  ADMIN_ACTOR,
  getAdminOverrides,
  refundBooking,
  setFlagEnabled,
  setIncidentState,
  setModerationDecision,
  setReviewDecision,
  setUserStatus,
  type IncidentState,
  type ModerationDecision,
  type ReviewDecision,
  type UserStatus,
} from './admin-store';
import { auditIsLive, fetchRealAudit, recordAudit } from './audit';
import {
  getCreatedIncidents,
  updateIncidentStatus,
  type Incident,
  type IncidentStatus,
} from './incidents';

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
  const ov = getAdminOverrides();
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

  const moderation: AdminModerationItem[] = all
    .slice(0, stats.pending_moderation)
    .map((l, i) => ({
      id: `mod-${l.id}`,
      listing_id: l.id,
      listing_title: l.title,
      listing_city: l.city,
      reason: MODERATION_SEED_REASONS[i % MODERATION_SEED_REASONS.length] as string,
      submitted_at: addDays(today, -(i + 1)),
      state: (i === 0 ? 'in_review' : 'pending') as AdminModerationItem['state'],
    }))
    // Drop anything a moderator has already actioned via the console.
    .filter((m) => !ov.moderation[m.id]);
  // Reflect resolved moderation in the pending count.
  stats.pending_moderation = moderation.length;

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

  const mergedAudit: AdminAuditEntry[] = [
    ...ov.audit.map((a) => ({
      id: a.id,
      actor: a.actor,
      action: a.action,
      target: a.target,
      reason_code: a.reason_code,
      created_at: a.created_at,
    })),
    ...audit,
  ];

  return {
    stats,
    listings: all,
    users: ADMIN_USERS_SEED.map((u) => ({
      ...u,
      status: ov.userStatus[u.id] ?? u.status,
    })),
    moderation,
    recent_bookings: recent,
    audit: mergedAudit,
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

// ---------------------------------------------------------------------------
// Phase A — expanded synthetic surface for the rest of the admin site.
// All derived from the same listings + per-host bookings so every link resolves.
// ---------------------------------------------------------------------------

export type AdminUserDetail = AdminUser & {
  phone: string;
  verified: boolean;
  city: string;
  country: string;
  signed_up_via: 'magic_link' | 'google' | 'apple';
  last_active: string;
  bookings_as_guest: Array<{
    id: string;
    listing_title: string;
    start_date: string;
    end_date: string;
    status: SyntheticBooking['status'];
    total_cents: number;
    currency: string;
  }>;
  audit_trail: AdminAuditEntry[];
  notes: string[];
};

export function useAdminUsers(query?: string) {
  return useQuery({
    queryKey: ['admin-users', query ?? ''],
    queryFn: async () => {
      const ov = getAdminOverrides();
      const withStatus = ADMIN_USERS_SEED.map((u) => ({
        ...u,
        status: ov.userStatus[u.id] ?? u.status,
      }));
      if (!query) return withStatus;
      const q = query.toLowerCase();
      return withStatus.filter(
        (u) =>
          u.display_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q),
      );
    },
    staleTime: 60_000,
  });
}

export function useAdminUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-user', userId],
    enabled: !!userId,
    queryFn: async (): Promise<AdminUserDetail | null> => {
      const u = ADMIN_USERS_SEED.find((x) => x.id === userId);
      if (!u) return null;
      const ov = getAdminOverrides();
      const status = ov.userStatus[u.id] ?? u.status;
      const d = await fetchAdminDashboard();
      // Map a few synthetic bookings onto this user so the inspector has content.
      const bookings = d.recent_bookings.slice(0, u.bookings).map((b) => ({
        id: b.id,
        listing_title: b.listing_title,
        start_date: b.start_date,
        end_date: b.end_date,
        status: b.status,
        total_cents: b.total_cents,
        currency: b.currency,
      }));
      // Seed audit (targets like "user:u-7") + any console actions on this user.
      const seedAudit = d.audit.filter((a) => a.target.includes(u.id.replace('u', 'u-')));
      const consoleAudit = d.audit.filter((a) => a.target === `user:${u.id}`);
      const audit = [...consoleAudit, ...seedAudit];
      const suspendedViaConsole = ov.userStatus[u.id] === 'suspended' && u.status !== 'suspended';
      const notes =
        status === 'suspended'
          ? suspendedViaConsole
            ? ['Suspended from the console — see audit trail for reason code.']
            : ['Suspended after 3 review-bombing reports — under T&S review.']
          : [];
      return {
        ...u,
        status,
        phone: `+1 555 ${100 + u.id.charCodeAt(1)}`,
        verified: u.role !== 'guest' || u.bookings > 0,
        city: ['Lisbon', 'Tokyo', 'Mumbai', 'Mexico City', 'Berlin'][u.id.charCodeAt(1) % 5] as string,
        country: ['Portugal', 'Japan', 'India', 'Mexico', 'Germany'][u.id.charCodeAt(1) % 5] as string,
        signed_up_via: 'magic_link',
        last_active: addDays(todayIso(), -Math.abs(u.id.charCodeAt(1) % 30)),
        bookings_as_guest: bookings,
        audit_trail: audit,
        notes,
      };
    },
    staleTime: 60_000,
  });
}

export type AdminBookingsFilter = 'all' | 'upcoming' | 'in_stay' | 'completed' | 'cancelled';

export function useAdminBookings(filter: AdminBookingsFilter = 'all') {
  return useQuery({
    queryKey: ['admin-bookings', filter],
    queryFn: async () => {
      const d = await fetchAdminDashboard();
      const ov = getAdminOverrides();
      // recent_bookings is 8; widen by re-fetching the synthesized full set across hosts.
      const all = (await collectAllBookings()).map((b) =>
        ov.bookingRefund[b.id]?.cancelled ? { ...b, status: 'cancelled' as const } : b,
      );
      const rows = filter === 'all' ? all : all.filter((b) => b.status === filter);
      return {
        rows: rows.sort((a, b) => b.created_at.localeCompare(a.created_at)),
        totals: {
          all: all.length,
          upcoming: all.filter((b) => b.status === 'upcoming').length,
          in_stay: all.filter((b) => b.status === 'in_stay').length,
          completed: all.filter((b) => b.status === 'completed').length,
          cancelled: all.filter((b) => b.status === 'cancelled').length,
        },
        currency: d.stats.gmv_currency,
      };
    },
    staleTime: 60_000,
  });
}

async function collectAllBookings(): Promise<SyntheticBooking[]> {
  const all = await fetchListings();
  const hostIds = Array.from(new Set(all.map((l) => l.host_id)));
  const dashboards = await Promise.all(hostIds.map((id) => fetchHostDashboard(id)));
  return dashboards.flatMap((d) => d.bookings);
}

export type AdminBookingDetail = SyntheticBooking & {
  events: Array<{ at: string; label: string; actor: string }>;
  payment: {
    method: string;
    authorised_cents: number;
    captured_cents: number;
    refunded_cents: number;
  };
  payout_cents: number;
  payout_date: string;
};

export function useAdminBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['admin-booking', bookingId],
    enabled: !!bookingId,
    queryFn: async (): Promise<AdminBookingDetail | null> => {
      if (!bookingId) return null;
      const all = await collectAllBookings();
      const found = all.find((x) => x.id === bookingId);
      if (!found) return null;
      const ov = getAdminOverrides();
      const override = ov.bookingRefund[bookingId];
      const b: SyntheticBooking =
        override?.cancelled ? { ...found, status: 'cancelled' } : found;
      const baseRefund = b.status === 'cancelled' ? b.total_cents : 0;
      const refunded = override ? override.refunded_cents : baseRefund;
      const captured = b.total_cents - refunded;
      const events: AdminBookingDetail['events'] = [
        { at: b.created_at, label: 'Reservation requested', actor: b.guest_name },
        { at: b.created_at, label: 'Auto-accepted (instant book)', actor: 'system' },
        { at: addDays(b.created_at, 1), label: 'Payment authorised', actor: 'stripe' },
      ];
      if (b.status === 'in_stay' || b.status === 'completed') {
        events.push({ at: b.start_date, label: 'Guest checked in', actor: b.guest_name });
      }
      if (b.status === 'completed') {
        events.push({ at: b.end_date, label: 'Guest checked out', actor: b.guest_name });
        events.push({ at: addDays(b.end_date, 1), label: 'Host payout scheduled', actor: 'system' });
      }
      if (b.status === 'cancelled' && !override) {
        events.push({ at: b.created_at, label: 'Booking cancelled by guest', actor: b.guest_name });
        events.push({ at: b.created_at, label: 'Full refund issued', actor: 'system' });
      }
      if (override) {
        events.push({
          at: todayIso(),
          label: override.cancelled
            ? 'Booking cancelled from console'
            : `Refund issued from console (${Math.round((override.refunded_cents / b.total_cents) * 100)}%)`,
          actor: ADMIN_ACTOR,
        });
      }
      return {
        ...b,
        events,
        payment: {
          method: 'visa •••• 4242',
          authorised_cents: b.total_cents,
          captured_cents: captured,
          refunded_cents: refunded,
        },
        payout_cents: Math.round(b.total_cents * 0.85),
        payout_date: addDays(b.end_date, 1),
      };
    },
    staleTime: 60_000,
  });
}

export type AdminIncident = {
  id: string;
  tier: 1 | 2 | 3;
  state: 'new' | 'assigned' | 'in_progress' | 'resolved';
  title: string;
  user_id: string;
  user_name: string;
  booking_id?: string;
  assigned_to?: string;
  opened_at: string;
  summary: string;
};

const INCIDENT_SEED: AdminIncident[] = [
  {
    id: 'i-001',
    tier: 1,
    state: 'in_progress',
    title: 'Guest reports lockout — host unreachable',
    user_id: 'u3',
    user_name: 'Mei Chen',
    booking_id: 'b-2014',
    assigned_to: 'concierge:naomi',
    opened_at: '2026-05-11',
    summary:
      'Guest arrived at the property and could not access the unit. Host has not responded in 30 minutes.',
  },
  {
    id: 'i-002',
    tier: 2,
    state: 'assigned',
    title: 'Cleanliness complaint with photos',
    user_id: 'u8',
    user_name: 'Aanya Verma',
    booking_id: 'b-1840',
    assigned_to: 'concierge:naomi',
    opened_at: '2026-05-10',
    summary: 'Photos show insufficient cleaning of bathroom and bedding. Partial refund considered.',
  },
  {
    id: 'i-003',
    tier: 3,
    state: 'new',
    title: 'Review off-topic — political remarks',
    user_id: 'u4',
    user_name: 'Ravi Sharma',
    opened_at: '2026-05-09',
    summary: 'Review violates content policy. Up for moderator decision.',
  },
  {
    id: 'i-004',
    tier: 2,
    state: 'resolved',
    title: 'Duplicate charge dispute',
    user_id: 'u5',
    user_name: 'Lucia Romero',
    booking_id: 'b-1923',
    assigned_to: 'finance:oliver',
    opened_at: '2026-05-07',
    summary: 'Card was authorised twice. Refunded $124 the same evening.',
  },
];

/** Fold a real / guest-created incident into the admin queue's shape. */
function incidentToAdmin(i: Incident): AdminIncident {
  return {
    id: i.id,
    tier: i.tier,
    state: i.status,
    title: i.subject,
    user_id: i.guest_id,
    user_name: i.guest_name,
    booking_id: i.booking_id ?? undefined,
    assigned_to: i.assigned_to ?? undefined,
    opened_at: i.created_at.slice(0, 10),
    summary: i.detail,
  };
}

export function useAdminIncidents() {
  return useQuery({
    queryKey: ['admin-incidents'],
    queryFn: async (): Promise<AdminIncident[]> => {
      const sb = tryGetSupabase();
      if (sb) {
        // Real mode: the queue is whatever guests + the system have opened.
        const { data, error } = await sb
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map((r) =>
          incidentToAdmin({
            id: String(r.id),
            guest_id: String(r.guest_id ?? ''),
            guest_name: String(r.guest_name ?? 'Guest'),
            booking_id: (r.booking_id as string) ?? null,
            listing_id: (r.listing_id as string) ?? null,
            listing_title: (r.listing_title as string) ?? null,
            host_id: (r.host_id as string) ?? null,
            host_name: (r.host_name as string) ?? null,
            category: (r.category as Incident['category']) ?? 'other',
            tier: (r.tier as Incident['tier']) ?? 3,
            status: (r.status as IncidentStatus) ?? 'new',
            subject: String(r.subject ?? ''),
            detail: String(r.detail ?? ''),
            assigned_to: (r.assigned_to as string) ?? null,
            created_at: String(r.created_at ?? ''),
            updated_at: String(r.updated_at ?? ''),
            resolved_at: (r.resolved_at as string) ?? null,
          }),
        );
      }
      // Demo: seed incidents (with console overrides) + anything guests opened
      // via "Get help" (incident-store) so the support→incident loop is visible.
      const ov = getAdminOverrides();
      const seed = INCIDENT_SEED.map((i) =>
        ov.incidents[i.id] ? { ...i, state: ov.incidents[i.id] as IncidentState } : i,
      );
      const created = getCreatedIncidents()
        .map(incidentToAdmin)
        .map((i) => (ov.incidents[i.id] ? { ...i, state: ov.incidents[i.id] as IncidentState } : i));
      return [...created, ...seed];
    },
    staleTime: 60_000,
  });
}

export type AdminFinanceData = {
  reconciliation: Array<{
    date: string;
    captures_cents: number;
    refunds_cents: number;
    payouts_cents: number;
    net_cents: number;
  }>;
  payout_queue: Array<{
    id: string;
    host_name: string;
    amount_cents: number;
    scheduled_for: string;
    status: 'scheduled' | 'sent' | 'failed';
  }>;
  chargebacks: Array<{
    id: string;
    booking_id: string;
    amount_cents: number;
    opened_at: string;
    state: 'open' | 'won' | 'lost';
  }>;
  gmv_currency: string;
  gmv_by_day: Array<{ date: string; gmv_cents: number }>;
};

export function useAdminFinance() {
  return useQuery({
    queryKey: ['admin-finance'],
    queryFn: async (): Promise<AdminFinanceData> => {
      const all = await collectAllBookings();
      const today = todayIso();
      const days: Array<{ date: string; captures: number; refunds: number; payouts: number }> = [];
      for (let i = 0; i < 14; i++) {
        const date = addDays(today, -i);
        const dayBookings = all.filter((b) => b.created_at.slice(0, 10) === date);
        const captures = dayBookings.reduce(
          (s, b) => (b.status === 'cancelled' ? s : s + b.total_cents),
          0,
        );
        const refunds = dayBookings.reduce(
          (s, b) => (b.status === 'cancelled' ? s + b.total_cents : s),
          0,
        );
        const payouts = Math.round(captures * 0.85);
        days.push({ date, captures, refunds, payouts });
      }
      const reconciliation = days.map((d) => ({
        date: d.date,
        captures_cents: d.captures,
        refunds_cents: d.refunds,
        payouts_cents: d.payouts,
        net_cents: d.captures - d.refunds - d.payouts,
      }));

      const hosts = Array.from(new Set(all.map((b) => b.listing_title)));
      const payout_queue = hosts.slice(0, 6).map((host, i) => ({
        id: `po-${i}`,
        host_name: host,
        amount_cents: 30000 + i * 12500,
        scheduled_for: addDays(today, i + 1),
        status: (i === 5 ? 'failed' : 'scheduled') as 'scheduled' | 'sent' | 'failed',
      }));

      const chargebacks = [
        { id: 'cb-1', booking_id: 'b-1923', amount_cents: 12400, opened_at: addDays(today, -2), state: 'open' as const },
        { id: 'cb-2', booking_id: 'b-1840', amount_cents: 8200,  opened_at: addDays(today, -6), state: 'won' as const },
      ];

      const gmv_by_day = days.map((d) => ({
        date: d.date,
        gmv_cents: d.captures - d.refunds,
      }));

      return {
        reconciliation,
        payout_queue,
        chargebacks,
        gmv_currency: all[0]?.currency ?? 'USD',
        gmv_by_day,
      };
    },
    staleTime: 60_000,
  });
}

export type AdminFlag = {
  key: string;
  description: string;
  default_enabled: boolean;
  enabled: boolean;
  rollout_pct: number;
  updated_by: string;
  updated_at: string;
};

const FLAGS_SEED: AdminFlag[] = [
  { key: 'instant_book',        description: 'Instant-book bypass of host accept step',           default_enabled: true,  enabled: true,  rollout_pct: 100, updated_by: 'admin:oliver',   updated_at: '2026-03-12' },
  { key: 'host_dashboard_v2',   description: 'New host dashboard surfaces (v2 preview)',          default_enabled: false, enabled: true,  rollout_pct: 100, updated_by: 'admin:oliver',   updated_at: '2026-04-25' },
  { key: 'admin_console_v2',    description: 'Admin/maintenance console (v2 preview)',            default_enabled: false, enabled: true,  rollout_pct: 100, updated_by: 'admin:oliver',   updated_at: '2026-04-25' },
  { key: 'google_oauth',        description: 'Allow Google OAuth on sign-in screen',              default_enabled: false, enabled: true,  rollout_pct: 100, updated_by: 'admin:oliver',   updated_at: '2026-05-11' },
  { key: 'smart_pricing',       description: 'Smart pricing suggestions (host opt-in, v3 only)',  default_enabled: false, enabled: false, rollout_pct: 0,   updated_by: 'admin:oliver',   updated_at: '2026-04-02' },
  { key: 'signup_freeze',       description: '🚨 Emergency: block all new guest signups',          default_enabled: false, enabled: false, rollout_pct: 0,   updated_by: 'admin:oliver',   updated_at: '2026-04-02' },
  { key: 'booking_freeze',      description: '🚨 Emergency: block all new bookings',               default_enabled: false, enabled: false, rollout_pct: 0,   updated_by: 'admin:oliver',   updated_at: '2026-04-02' },
  { key: 'payment_freeze',      description: '🚨 Emergency: stop payment captures + payouts',     default_enabled: false, enabled: false, rollout_pct: 0,   updated_by: 'admin:oliver',   updated_at: '2026-04-02' },
];

export function useAdminFlags() {
  return useQuery({
    queryKey: ['admin-flags'],
    queryFn: async () => {
      const ov = getAdminOverrides();
      return FLAGS_SEED.map((f) =>
        ov.flags[f.key] !== undefined
          ? { ...f, enabled: ov.flags[f.key] as boolean, updated_by: ADMIN_ACTOR, updated_at: todayIso() }
          : f,
      );
    },
    staleTime: 60_000,
  });
}

const AUDIT_SEED_EXTRA: AdminAuditEntry[] = [
  { id: 'a7',  actor: 'concierge:naomi',  action: 'goodwill_credit',     target: 'booking:b-1755',  reason_code: 'amenity_unavailable', created_at: '2026-05-09T18:42Z' },
  { id: 'a8',  actor: 'moderator:oliver', action: 'review_kept',         target: 'review:r-0301',   reason_code: 'within_policy',       created_at: '2026-05-09T10:14Z' },
  { id: 'a9',  actor: 'finance:oliver',   action: 'payout_retried',      target: 'payout:po-0042',  reason_code: 'bank_temp_failure',   created_at: '2026-05-08T15:01Z' },
  { id: 'a10', actor: 'admin:oliver',     action: 'flag_enabled',        target: 'flag:google_oauth', reason_code: 'launch_window',     created_at: '2026-05-11T09:30Z' },
  { id: 'a11', actor: 'moderator:oliver', action: 'listing_requested_changes', target: 'listing:l-roma-trastevere', reason_code: 'photo_quality', created_at: '2026-05-10T13:22Z' },
  { id: 'a12', actor: 'concierge:naomi',  action: 'rebook_protection',   target: 'booking:b-2040',  reason_code: 'host_cancellation',   created_at: '2026-05-07T07:15Z' },
];

export type AdminAuditFilter = {
  actor?: string;
  action?: string;
};

export function useAdminAudit(filter: AdminAuditFilter = {}) {
  return useQuery({
    queryKey: ['admin-audit', filter],
    queryFn: async () => {
      // Real mode: the audit log is the source of truth (docs/14 §5).
      if (auditIsLive()) return fetchRealAudit(filter);
      const d = await fetchAdminDashboard();
      let entries = [...d.audit, ...AUDIT_SEED_EXTRA];
      if (filter.actor)
        entries = entries.filter((e) => e.actor.toLowerCase().includes(filter.actor!.toLowerCase()));
      if (filter.action)
        entries = entries.filter((e) => e.action.toLowerCase().includes(filter.action!.toLowerCase()));
      entries.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return entries;
    },
    staleTime: 60_000,
  });
}

export type AdminSearchResult =
  | { kind: 'user'; id: string; label: string; sub: string }
  | { kind: 'booking'; id: string; label: string; sub: string }
  | { kind: 'listing'; id: string; label: string; sub: string }
  | { kind: 'incident'; id: string; label: string; sub: string };

export function useAdminGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['admin-search', query],
    enabled: query.trim().length > 0,
    queryFn: async (): Promise<AdminSearchResult[]> => {
      const q = query.trim().toLowerCase();
      const d = await fetchAdminDashboard();
      const out: AdminSearchResult[] = [];
      for (const u of ADMIN_USERS_SEED) {
        if (u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
          out.push({ kind: 'user', id: u.id, label: u.display_name, sub: u.email });
        }
      }
      const allBookings = await collectAllBookings();
      for (const b of allBookings) {
        if (
          b.id.toLowerCase().includes(q) ||
          b.guest_name.toLowerCase().includes(q) ||
          b.listing_title.toLowerCase().includes(q)
        ) {
          out.push({
            kind: 'booking',
            id: b.id,
            label: b.listing_title,
            sub: `${b.guest_name} · ${b.start_date}`,
          });
        }
      }
      for (const l of d.listings) {
        if (
          l.id.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q)
        ) {
          out.push({
            kind: 'listing',
            id: l.id,
            label: l.title,
            sub: `${l.city}, ${l.country}`,
          });
        }
      }
      for (const i of INCIDENT_SEED) {
        if (
          i.id.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.user_name.toLowerCase().includes(q)
        ) {
          out.push({ kind: 'incident', id: i.id, label: i.title, sub: i.user_name });
        }
      }
      return out.slice(0, 40);
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations — privileged staff actions.
//
// These persist client-side via ./admin-store (v2-preview): they write the
// override + an audit entry, then invalidate every admin query so the change
// reflects optimistically across the console. When real staff auth + Supabase
// land, each mutationFn becomes a privileged server call (docs/14-admin-ops.md).
// ---------------------------------------------------------------------------

const ADMIN_QUERY_KEYS = [
  'admin-dashboard',
  'admin-users',
  'admin-user',
  'admin-bookings',
  'admin-booking',
  'admin-incidents',
  'admin-flags',
  'admin-audit',
  'admin-finance',
  'admin-search',
];

function invalidateAdmin(qc: ReturnType<typeof useQueryClient>) {
  for (const key of ADMIN_QUERY_KEYS) qc.invalidateQueries({ queryKey: [key] });
}

export function useAdminSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      userId: string;
      status: UserStatus;
      reason_code: string;
      note?: string;
    }) => {
      setUserStatus(v.userId, v.status, v.reason_code, v.note);
      await recordAudit({
        action: v.status === 'suspended' ? 'user_suspended' : 'user_reinstated',
        target: `user:${v.userId}`,
        reason_code: v.reason_code,
        note: v.note,
      });
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}

export function useAdminModerateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      itemId: string;
      listingId: string;
      decision: ModerationDecision;
      reason_code: string;
      note?: string;
    }) => {
      setModerationDecision(v.itemId, v.listingId, v.decision, v.reason_code, v.note);
      await recordAudit({
        action: `listing_${v.decision}`,
        target: `listing:${v.listingId}`,
        reason_code: v.reason_code,
        note: v.note,
      });
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}

export function useAdminModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      reviewId: string;
      decision: ReviewDecision;
      reason_code: string;
      note?: string;
    }) => {
      setReviewDecision(v.reviewId, v.decision, v.reason_code, v.note);
      await recordAudit({
        action: v.decision === 'removed' ? 'review_removed' : 'review_kept',
        target: `review:${v.reviewId}`,
        reason_code: v.reason_code,
        note: v.note,
      });
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}

export function useAdminToggleFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { key: string; enabled: boolean; reason_code: string; note?: string }) => {
      setFlagEnabled(v.key, v.enabled, v.reason_code, v.note);
      await recordAudit({
        action: v.enabled ? 'flag_enabled' : 'flag_disabled',
        target: `flag:${v.key}`,
        reason_code: v.reason_code,
        note: v.note,
      });
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}

export function useAdminSetIncidentState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      incidentId: string;
      state: IncidentState;
      reason_code: string;
      note?: string;
    }) => {
      // Real rows + guest-created incidents flow through ./incidents (which
      // writes the status + an incident_event). Synthetic seed incidents fall
      // back to the admin-store override map.
      const assigned_to = v.state === 'in_progress' ? ADMIN_ACTOR : undefined;
      const handled = await updateIncidentStatus(
        v.incidentId,
        v.state as IncidentStatus,
        ADMIN_ACTOR,
        v.note,
        assigned_to,
      );
      if (!handled) setIncidentState(v.incidentId, v.state, v.reason_code, v.note);
      await recordAudit({
        action: v.state === 'resolved' ? 'incident_resolved' : `incident_${v.state}`,
        target: `incident:${v.incidentId}`,
        reason_code: v.reason_code,
        note: v.note,
      });
    },
    onSuccess: () => {
      invalidateAdmin(qc);
      for (const key of ['my-incidents', 'host-incidents', 'incident', 'incident-events']) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useAdminRefundBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      bookingId: string;
      refunded_cents: number;
      cancelled: boolean;
      reason_code: string;
      note?: string;
    }) => {
      refundBooking(v.bookingId, v.refunded_cents, v.cancelled, v.reason_code, v.note);
      await recordAudit({
        action: v.cancelled ? 'booking_cancelled' : 'booking_refunded',
        target: `booking:${v.bookingId}`,
        reason_code: v.reason_code,
        note: v.note,
      });
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}
