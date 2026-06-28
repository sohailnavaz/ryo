// Client-side host mutation store (v2-preview / auth-parked).
//
// The host site renders synthetic data (see ./host.ts). Real host mutations
// against Supabase need real auth + RLS (docs/13-host-tools.md), which is parked
// until email/SMTP is wired (only the 3 demo roles work today). Until then, host
// actions are persisted *client-side* here: a single override layer that the host
// read hooks merge over the seed data, plus an append-only audit log.
//
// Same pattern as ./admin-store.ts and ./host-calendar-store.ts — a module
// singleton backed by `useSyncExternalStore` + localStorage, so actions survive a
// page refresh and reflect optimistically across every host screen.
//
// REAL BACKEND (L3): when a genuine host session exists (not a demo identity),
// each mutator ALSO performs the real Supabase write — booking accept/decline +
// host cancellation on `bookings`, review replies into `host_review_replies` —
// and appends an `audit_log` row. The localStorage commit still runs so the
// optimistic overlay shows instantly; the real host-dashboard read
// (tryFetchRealHostDashboard in ./host.ts) converges on the persisted truth.
// Demo identities (`app_metadata.demo === true`) have no real row to write, so
// only the localStorage path runs.

import { useSyncExternalStore } from 'react';
import { getSupabase, tryGetSupabase } from './client';

const STORAGE_KEY = 'bnb.host-actions';

/** A host's response to a booking *request* (pre-confirmation). */
export type BookingDecision = 'accepted' | 'declined';

/** A host-initiated cancellation of a confirmed booking, with penalty note. */
export type HostCancellation = {
  reason_code: string;
  note?: string;
  /** Disclosed host-penalty estimate at the time of cancelling (cents). */
  penalty_cents: number;
  cancelled_at: string;
};

/** A single host reply to a guest review (one per review). */
export type ReviewReply = {
  body: string;
  created_at: string;
};

export type LocalHostAuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  reason_code: string;
  note?: string;
  created_at: string;
};

export type HostActionOverrides = {
  /** bookingId → accept / decline of a pending request. */
  bookingDecision: Record<string, BookingDecision>;
  /** bookingId → host-initiated cancellation. */
  bookingCancellation: Record<string, HostCancellation>;
  /** reviewId → the host's single public reply. */
  reviewReplies: Record<string, ReviewReply>;
  audit: LocalHostAuditEntry[];
};

/** Who the host console attributes actions to until host auth lands. */
export const HOST_ACTOR = 'host:console';

const EMPTY: HostActionOverrides = {
  bookingDecision: {},
  bookingCancellation: {},
  reviewReplies: {},
  audit: [],
};

let cached: HostActionOverrides = readStorage();
const listeners = new Set<() => void>();

function readStorage(): HostActionOverrides {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<HostActionOverrides>) };
  } catch {
    return EMPTY;
  }
}

function writeStorage(o: HostActionOverrides) {
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

function commit(next: HostActionOverrides) {
  cached = next;
  writeStorage(next);
  emit();
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

// --- real backend (Supabase) ------------------------------------------------

/** A *real* Supabase user id, or null for demo / unconfigured. Demo identities
 *  carry `app_metadata.demo === true`; only genuine sessions hit the tables. */
async function realUserId(): Promise<string | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if ((user.app_metadata as { demo?: boolean } | undefined)?.demo === true) return null;
  return user.id;
}

/** Append an audit row for a host action. Best-effort: a failed audit write must
 *  never block the primary mutation. */
async function appendAudit(entry: {
  action: string;
  target: string;
  reason_code: string;
  note?: string;
}): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('audit_log').insert({
      actor_label: 'host',
      action: entry.action,
      target: entry.target,
      reason_code: entry.reason_code,
      note: entry.note ?? null,
    });
  } catch {
    // best-effort; audit_log insert is restricted to staff under RLS, so for a
    // plain host this no-ops silently — the primary write is what matters.
  }
}

/** Update a booking the host owns (RLS: host of the listing). */
async function updateOwnedBooking(
  bookingId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('bookings').update(patch).eq('id', bookingId);
  if (error) throw error;
}

async function remoteDecideBooking(
  bookingId: string,
  decision: BookingDecision,
  reason_code: string,
  note?: string,
): Promise<void> {
  await updateOwnedBooking(bookingId, {
    status: decision, // 'accepted' | 'declined'
    host_decision_at: new Date().toISOString(),
    host_decision_note: note ?? null,
  });
  await appendAudit({
    action: decision === 'accepted' ? 'booking_request_accepted' : 'booking_request_declined',
    target: `booking:${bookingId}`,
    reason_code,
    note,
  });
}

async function remoteCancelBooking(
  bookingId: string,
  reason_code: string,
  note?: string,
): Promise<void> {
  await updateOwnedBooking(bookingId, {
    status: 'cancelled',
    cancel_reason_code: reason_code,
    cancelled_by: 'host',
    host_decision_at: new Date().toISOString(),
    host_decision_note: note ?? null,
  });
  await appendAudit({
    action: 'booking_host_cancelled',
    target: `booking:${bookingId}`,
    reason_code,
    note,
  });
}

async function remoteReplyToReview(reviewId: string, body: string): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('host_review_replies')
    .upsert({ review_id: reviewId, host_id: uid, body }, { onConflict: 'review_id' });
  if (error) throw error;
  await appendAudit({
    action: 'review_replied',
    target: `review:${reviewId}`,
    reason_code: 'host_reply',
    note: body.slice(0, 140),
  });
}

/** Fire a remote write for a real host session; swallow errors so the optimistic
 *  localStorage overlay (already committed) remains the source of UI truth even
 *  if the network write fails. Returns silently for demo / unconfigured. */
function syncRemote(run: (uid: string) => Promise<void>): void {
  void realUserId()
    .then((uid) => {
      if (uid) return run(uid);
    })
    .catch(() => {
      // best-effort; localStorage overlay already reflects the action.
    });
}

function pushAudit(
  o: HostActionOverrides,
  entry: Omit<LocalHostAuditEntry, 'id' | 'created_at' | 'actor'>,
): HostActionOverrides {
  const audit: LocalHostAuditEntry = {
    id: `lh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: HOST_ACTOR,
    created_at: nowStamp(),
    ...entry,
  };
  return { ...o, audit: [audit, ...o.audit] };
}

// --- mutators ---------------------------------------------------------------

/** Accept or decline a pending booking request. */
export function setBookingDecision(
  bookingId: string,
  decision: BookingDecision,
  reason_code: string,
  note?: string,
): void {
  let next = {
    ...cached,
    bookingDecision: { ...cached.bookingDecision, [bookingId]: decision },
  };
  next = pushAudit(next, {
    action: decision === 'accepted' ? 'booking_request_accepted' : 'booking_request_declined',
    target: `booking:${bookingId}`,
    reason_code,
    note,
  });
  commit(next);
  syncRemote(() => remoteDecideBooking(bookingId, decision, reason_code, note));
}

/** Host-initiated cancellation of a confirmed booking (with penalty disclosure). */
export function cancelBookingAsHost(
  bookingId: string,
  penalty_cents: number,
  reason_code: string,
  note?: string,
): void {
  let next = {
    ...cached,
    bookingCancellation: {
      ...cached.bookingCancellation,
      [bookingId]: { reason_code, note, penalty_cents, cancelled_at: nowStamp() },
    },
  };
  next = pushAudit(next, {
    action: 'booking_host_cancelled',
    target: `booking:${bookingId}`,
    reason_code,
    note,
  });
  commit(next);
  syncRemote(() => remoteCancelBooking(bookingId, reason_code, note));
}

/** Post (or replace) the host's single public reply to a review. */
export function replyToReview(reviewId: string, body: string): void {
  const trimmed = body.trim();
  let next = {
    ...cached,
    reviewReplies: {
      ...cached.reviewReplies,
      [reviewId]: { body: trimmed, created_at: nowStamp() },
    },
  };
  next = pushAudit(next, {
    action: 'review_replied',
    target: `review:${reviewId}`,
    reason_code: 'host_reply',
    note: trimmed.slice(0, 140),
  });
  commit(next);
  syncRemote(() => remoteReplyToReview(reviewId, trimmed));
}

export function resetHostActionOverrides(): void {
  commit(EMPTY);
}

// --- reads ------------------------------------------------------------------

export function getHostActionOverrides(): HostActionOverrides {
  return cached;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): HostActionOverrides {
  return cached;
}

function serverSnapshot(): HostActionOverrides {
  return EMPTY;
}

export function useHostActionOverrides(): HostActionOverrides {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
