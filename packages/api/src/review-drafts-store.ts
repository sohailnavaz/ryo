'use client';

// Client-side store for guest "write a review after a stay" (v2-preview).
//
// Real review writes will be a Supabase insert into `reviews` (guarded by RLS so
// only a guest with a completed booking can post). Until auth + that write land,
// a guest's review of a past stay is persisted *client-side* here so the loop is
// demonstrable end-to-end: a completed trip on /trips → leave a star rating +
// text → "your review" shows afterward and survives a refresh.
//
// Same pattern as ./admin-store.ts / ./incident-store.ts — a module singleton
// backed by `useSyncExternalStore` + localStorage. When the real write lands,
// ./reviews.ts prefers Supabase and this becomes the offline/preview fallback
// only (per the 2026-04-25 v2-preview deviation).

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bnb.review-drafts';

export type ReviewDraft = {
  /** Keyed on the booking id — one review per completed stay. */
  booking_id: string;
  listing_id: string;
  listing_title: string;
  rating: number; // 1–5
  body: string;
  created_at: string;
};

export type ReviewDraftState = {
  drafts: Record<string, ReviewDraft>;
};

const EMPTY: ReviewDraftState = { drafts: {} };

let cached: ReviewDraftState = readStorage();
const listeners = new Set<() => void>();

function readStorage(): ReviewDraftState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<ReviewDraftState>) };
  } catch {
    return EMPTY;
  }
}

function writeStorage(s: ReviewDraftState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // best-effort
  }
}

function commit(next: ReviewDraftState) {
  cached = next;
  writeStorage(next);
  listeners.forEach((l) => l());
}

// --- mutators ---------------------------------------------------------------

export function saveReviewDraft(input: {
  booking_id: string;
  listing_id: string;
  listing_title: string;
  rating: number;
  body: string;
}): void {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const existing = cached.drafts[input.booking_id];
  const draft: ReviewDraft = {
    booking_id: input.booking_id,
    listing_id: input.listing_id,
    listing_title: input.listing_title,
    rating,
    body: input.body.trim(),
    created_at: existing?.created_at ?? new Date().toISOString(),
  };
  commit({ drafts: { ...cached.drafts, [input.booking_id]: draft } });
}

export function deleteReviewDraft(bookingId: string): void {
  if (!cached.drafts[bookingId]) return;
  const next = { ...cached.drafts };
  delete next[bookingId];
  commit({ drafts: next });
}

export function resetReviewDrafts(): void {
  commit(EMPTY);
}

// --- reads ------------------------------------------------------------------

export function getReviewDraft(bookingId: string): ReviewDraft | null {
  return cached.drafts[bookingId] ?? null;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): ReviewDraftState {
  return cached;
}

function serverSnapshot(): ReviewDraftState {
  return EMPTY;
}

export function useReviewDrafts(): ReviewDraftState {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Convenience hook: the review (if any) a guest left for one booking. */
export function useReviewDraft(bookingId: string | undefined): ReviewDraft | null {
  const { drafts } = useReviewDrafts();
  return bookingId ? drafts[bookingId] ?? null : null;
}
