// Offline Stay Pack store.
//
// A traveler with no signal still needs their trip in front of them: where to
// go, who to call, the confirmation code, the receipt. We cache those
// essentials *client-side* (useSyncExternalStore + localStorage) the last time
// the app was online, so the /offline route renders fully without a network.
//
// Same module-singleton pattern as ./admin-store.ts and ./demo-auth.ts. This is
// a read-cache only — no Supabase writes, no schema. It's safe to keep on the
// device because it mirrors what the guest already booked.

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bnb.offline-pack';

/** A single upcoming/in-stay trip, flattened to everything needed offline. */
export type OfflineTrip = {
  id: string;
  listing_id: string;
  listing_title: string;
  /** Full street address where known, else city/country. */
  address: string;
  city: string;
  country: string;
  check_in: string; // ISO yyyy-mm-dd
  check_out: string; // ISO yyyy-mm-dd
  nights: number;
  /** Best-effort host contact for the stay. */
  host_name: string;
  host_phone?: string;
  /** Short human booking reference (e.g. RYO-AB12CD). */
  confirmation_code: string;
  total_cents: number;
  currency: string;
};

export type OfflinePack = {
  /** Which guest this pack belongs to (id or 'anon'); guards against showing the wrong trip. */
  owner: string;
  /** When the pack was last refreshed while online. */
  saved_at: string;
  trips: OfflineTrip[];
};

const EMPTY: OfflinePack = { owner: 'anon', saved_at: '', trips: [] };

let cached: OfflinePack = readStorage();
const listeners = new Set<() => void>();

function readStorage(): OfflinePack {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<OfflinePack>) };
  } catch {
    return EMPTY;
  }
}

function writeStorage(p: OfflinePack) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // best-effort (private mode / quota)
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: OfflinePack) {
  cached = next;
  writeStorage(next);
  emit();
}

/**
 * Replace the cached pack with the latest online trips. Call this whenever
 * fresh trip data is available (e.g. on the offline screen while still online).
 * Owner-scoped so signing in/out doesn't surface a stale guest's trip.
 */
export function saveOfflinePack(owner: string, trips: OfflineTrip[]): void {
  commit({
    owner: owner || 'anon',
    saved_at: new Date().toISOString(),
    trips,
  });
}

export function clearOfflinePack(): void {
  commit(EMPTY);
}

export function getOfflinePack(): OfflinePack {
  return cached;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): OfflinePack {
  return cached;
}

function serverSnapshot(): OfflinePack {
  return EMPTY;
}

export function useOfflinePack(): OfflinePack {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

// --- derivation -------------------------------------------------------------

/** Deterministic short booking reference from a booking id. */
export function confirmationCodeFor(bookingId: string): string {
  let h = 2166136261;
  for (let i = 0; i < bookingId.length; i++) {
    h ^= bookingId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let n = h >>> 0;
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length) + 1;
  }
  return `RYO-${out}`;
}
