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
// page refresh and reflect optimistically across every host screen. When this
// slice graduates to real v2, every mutator below is replaced by a Supabase write
// + RLS check and this file is deleted (per the 2026-04-25 v2-preview deviation).

import { useSyncExternalStore } from 'react';

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
