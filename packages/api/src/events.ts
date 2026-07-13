// The analytics spine — client side. (docs/15-admin-console.md §5)
//
// Events are FACTS: past-tense, immutable, never used to derive state. State lives
// in ordinary tables; events exist so we can answer questions we didn't think to ask
// when the screen was built.
//
// Two rules this module enforces:
//   1. The actor is stamped from the JWT server-side (`record_event()` ignores any
//      caller-supplied identity), so an event can never lie about who caused it.
//   2. Recording an event NEVER throws and never blocks. Analytics must not be able
//      to break a booking.
//
// Hook-free on purpose, so `server.ts` can re-export it for route handlers.

import { tryGetSupabase } from './client';

/**
 * The canonical taxonomy. Named once, `noun.past_tense`, and never renamed — a
 * renamed event silently breaks every historical metric built on it.
 *
 * Admin mutations (`user.suspend`, `listing.approve`, …) are emitted server-side by
 * `admin_action()`; they are not in this list because clients never record them.
 */
export type EventName =
  // discovery
  | 'search.performed'
  | 'search.zero_results' // the cheapest supply-gap signal we get — always instrument
  | 'listing.viewed'
  // booking funnel
  | 'booking.started'
  | 'booking.confirmed'
  | 'booking.cancelled'
  // money
  | 'payment.captured'
  | 'payment.refunded'
  | 'payout.sent'
  | 'payout.failed'
  // supply
  | 'listing.submitted'
  // trust & support
  | 'review.submitted'
  | 'incident.opened'
  | 'incident.resolved'
  | 'message.sent'
  | 'concierge.replied'
  | 'concierge.deflected'
  // identity
  | 'user.signed_up';

export type EventSource = 'web' | 'mobile' | 'server' | 'admin' | 'system';

export type RecordEventInput = {
  name: EventName;
  subjectType?: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
  source?: EventSource;
  sessionId?: string;
};

/** Best-effort per-tab session id, so a funnel can be stitched without a cookie. */
let sessionId: string | null = null;

function getSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  if (sessionId) return sessionId;
  try {
    const existing = window.sessionStorage.getItem('ryo.session_id');
    if (existing) {
      sessionId = existing;
      return sessionId;
    }
    const fresh = newId();
    window.sessionStorage.setItem('ryo.session_id', fresh);
    sessionId = fresh;
    return sessionId;
  } catch {
    return undefined;
  }
}

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Record a fact. Fire-and-forget: resolves whether or not it landed, and never throws.
 *
 * Silently no-ops when Supabase isn't configured (dev/dummy mode) — an unwired
 * environment should still be usable.
 */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  const supabase = tryGetSupabase();
  if (!supabase) return;

  try {
    await supabase.rpc('record_event', {
      p_name: input.name,
      p_subject_type: input.subjectType ?? null,
      p_subject_id: input.subjectId ?? null,
      p_payload: input.payload ?? {},
      p_source: input.source ?? (typeof window === 'undefined' ? 'server' : 'web'),
      p_session_id: input.sessionId ?? getSessionId() ?? null,
    });
  } catch {
    // Analytics is never allowed to break the product.
  }
}

/** Fire an event without awaiting it — for hot paths where latency matters. */
export function trackEvent(input: RecordEventInput): void {
  void recordEvent(input);
}
