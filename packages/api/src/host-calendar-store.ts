// Client-side host-calendar override store (v2-preview).
//
// The host calendar renders synthetic per-day availability/pricing (see
// `useHostCalendar` in ./host.ts). Until a real `listing_calendar` table + RLS
// land (docs/13-host-tools.md), host calendar edits — block/unblock a date and
// per-day price overrides — are persisted *client-side* here: a single override
// layer that `useHostCalendar` merges over the synthetic days.
//
// Same pattern as ./admin-store.ts and ./demo-auth.ts — a module singleton
// backed by `useSyncExternalStore` + localStorage, so edits survive a refresh
// and reflect optimistically. When this graduates to real v2, each mutator
// becomes a Supabase write + RLS check and this file is deleted (per the
// 2026-04-25 v2-preview deviation).

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bnb.host-calendar-overrides';

/** A per-day override key — `${listingId}|${yyyy-mm-dd}`. */
export type DayKey = string;

export function dayKey(listingId: string, date: string): DayKey {
  return `${listingId}|${date}`;
}

export type HostCalendarOverrides = {
  /** Manually blocked (true) or force-opened (false) days, keyed by `dayKey`. */
  blocked: Record<DayKey, boolean>;
  /** Per-day nightly price override in cents, keyed by `dayKey`. */
  priceCents: Record<DayKey, number>;
};

const EMPTY: HostCalendarOverrides = { blocked: {}, priceCents: {} };

let cached: HostCalendarOverrides = readStorage();
const listeners = new Set<() => void>();

function readStorage(): HostCalendarOverrides {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<HostCalendarOverrides>) };
  } catch {
    return EMPTY;
  }
}

function writeStorage(o: HostCalendarOverrides) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  } catch {
    // best-effort
  }
}

function commit(next: HostCalendarOverrides) {
  cached = next;
  writeStorage(next);
  listeners.forEach((l) => l());
}

// --- mutators ---------------------------------------------------------------

/** Block or force-open a single day. `null` clears the override (back to synthetic). */
export function setDayBlocked(listingId: string, date: string, blocked: boolean | null): void {
  const key = dayKey(listingId, date);
  const nextBlocked = { ...cached.blocked };
  if (blocked === null) delete nextBlocked[key];
  else nextBlocked[key] = blocked;
  commit({ ...cached, blocked: nextBlocked });
}

/** Set a per-day price override in cents. `null` clears it (back to listing default). */
export function setDayPrice(listingId: string, date: string, priceCents: number | null): void {
  const key = dayKey(listingId, date);
  const nextPrice = { ...cached.priceCents };
  if (priceCents === null) delete nextPrice[key];
  else nextPrice[key] = priceCents;
  commit({ ...cached, priceCents: nextPrice });
}

export function resetHostCalendarOverrides(): void {
  commit(EMPTY);
}

// --- reads ------------------------------------------------------------------

export function getHostCalendarOverrides(): HostCalendarOverrides {
  return cached;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): HostCalendarOverrides {
  return cached;
}

function serverSnapshot(): HostCalendarOverrides {
  return EMPTY;
}

export function useHostCalendarOverrides(): HostCalendarOverrides {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
