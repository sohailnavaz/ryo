// Client-side admin mutation store (v2-preview).
//
// The admin/maintenance console renders synthetic data (see ./admin.ts). Until
// real privileged Supabase queries + role gates land (docs/14-admin-ops.md),
// staff actions are persisted *client-side* here: a single override layer that
// the read hooks merge over the seed data, plus an append-only audit log.
//
// Same pattern as ./demo-auth.ts — a module singleton backed by
// `useSyncExternalStore` + localStorage, so actions survive a page refresh and
// reflect optimistically across every screen. When this slice graduates to real
// v2, every mutator below is replaced by a Supabase write + RLS check and this
// file is deleted (per the 2026-04-25 v2-preview deviation).

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bnb.admin-overrides';

export type UserStatus = 'active' | 'suspended';
export type ModerationDecision = 'approved' | 'rejected' | 'changes_requested';
export type ReviewDecision = 'kept' | 'removed';
export type IncidentState = 'new' | 'assigned' | 'in_progress' | 'resolved';

export type LocalAuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  reason_code: string;
  note?: string;
  created_at: string;
};

export type AdminOverrides = {
  userStatus: Record<string, UserStatus>;
  moderation: Record<string, ModerationDecision>;
  reviewModeration: Record<string, ReviewDecision>;
  flags: Record<string, boolean>;
  incidents: Record<string, IncidentState>;
  bookingRefund: Record<string, { refunded_cents: number; cancelled: boolean }>;
  audit: LocalAuditEntry[];
};

/** Who the console attributes actions to until staff auth lands (docs/14 §7). */
export const ADMIN_ACTOR = 'admin:console';

const EMPTY: AdminOverrides = {
  userStatus: {},
  moderation: {},
  reviewModeration: {},
  flags: {},
  incidents: {},
  bookingRefund: {},
  audit: [],
};

let cached: AdminOverrides = readStorage();
const listeners = new Set<() => void>();

function readStorage(): AdminOverrides {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<AdminOverrides>) };
  } catch {
    return EMPTY;
  }
}

function writeStorage(o: AdminOverrides) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  } catch {
    // best-effort
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: AdminOverrides) {
  cached = next;
  writeStorage(next);
  emit();
}

function pushAudit(o: AdminOverrides, entry: Omit<LocalAuditEntry, 'id' | 'created_at' | 'actor'>): AdminOverrides {
  const audit: LocalAuditEntry = {
    id: `la-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: ADMIN_ACTOR,
    created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    ...entry,
  };
  return { ...o, audit: [audit, ...o.audit] };
}

// --- mutators ---------------------------------------------------------------

export function setUserStatus(
  userId: string,
  status: UserStatus,
  reason_code: string,
  note?: string,
): void {
  let next = { ...cached, userStatus: { ...cached.userStatus, [userId]: status } };
  next = pushAudit(next, {
    action: status === 'suspended' ? 'user_suspended' : 'user_reinstated',
    target: `user:${userId}`,
    reason_code,
    note,
  });
  commit(next);
}

export function setModerationDecision(
  itemId: string,
  listingId: string,
  decision: ModerationDecision,
  reason_code: string,
  note?: string,
): void {
  let next = { ...cached, moderation: { ...cached.moderation, [itemId]: decision } };
  next = pushAudit(next, {
    action: `listing_${decision}`,
    target: `listing:${listingId}`,
    reason_code,
    note,
  });
  commit(next);
}

export function setReviewDecision(
  reviewId: string,
  decision: ReviewDecision,
  reason_code: string,
  note?: string,
): void {
  let next = { ...cached, reviewModeration: { ...cached.reviewModeration, [reviewId]: decision } };
  next = pushAudit(next, {
    action: decision === 'removed' ? 'review_removed' : 'review_kept',
    target: `review:${reviewId}`,
    reason_code,
    note,
  });
  commit(next);
}

export function setFlagEnabled(
  key: string,
  enabled: boolean,
  reason_code: string,
  note?: string,
): void {
  let next = { ...cached, flags: { ...cached.flags, [key]: enabled } };
  next = pushAudit(next, {
    action: enabled ? 'flag_enabled' : 'flag_disabled',
    target: `flag:${key}`,
    reason_code,
    note,
  });
  commit(next);
}

export function setIncidentState(
  incidentId: string,
  state: IncidentState,
  reason_code: string,
  note?: string,
): void {
  let next = { ...cached, incidents: { ...cached.incidents, [incidentId]: state } };
  next = pushAudit(next, {
    action: state === 'resolved' ? 'incident_resolved' : `incident_${state}`,
    target: `incident:${incidentId}`,
    reason_code,
    note,
  });
  commit(next);
}

export function refundBooking(
  bookingId: string,
  refunded_cents: number,
  cancelled: boolean,
  reason_code: string,
  note?: string,
): void {
  let next = {
    ...cached,
    bookingRefund: { ...cached.bookingRefund, [bookingId]: { refunded_cents, cancelled } },
  };
  next = pushAudit(next, {
    action: cancelled ? 'booking_cancelled' : 'booking_refunded',
    target: `booking:${bookingId}`,
    reason_code,
    note,
  });
  commit(next);
}

export function resetAdminOverrides(): void {
  commit(EMPTY);
}

// --- reads ------------------------------------------------------------------

export function getAdminOverrides(): AdminOverrides {
  return cached;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): AdminOverrides {
  return cached;
}

function serverSnapshot(): AdminOverrides {
  return EMPTY;
}

export function useAdminOverrides(): AdminOverrides {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
