// Client-side notifications store (v2-preview).
//
// Ryo's guest notifications inbox has no backend yet — there is no
// `notifications` table and no realtime channel (planned alongside concierge +
// messaging, docs roadmap). Until that lands, the inbox is persisted
// *client-side* here, mirroring ./admin-store.ts: a module singleton backed by
// `useSyncExternalStore` + localStorage, seeded with realistic items, so reads
// + mutations (markRead / markAllRead / clearAll) survive a refresh and reflect
// optimistically across every screen.
//
// When this slice graduates to real v2, the seed + mutators below are replaced
// by Supabase reads/writes (+ RLS + realtime) and this file is deleted.

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bnb.guest-notifications';

export type NotificationKind = 'booking' | 'message' | 'review' | 'system';

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO-8601 timestamp. */
  created_at: string;
  read: boolean;
};

type NotificationsState = {
  items: Notification[];
  /** true until the user has explicitly cleared the inbox at least once. */
  seeded: boolean;
};

// --- seed -------------------------------------------------------------------

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

/** ~8 realistic items, newest first; a mix of kinds + read states. */
function seedItems(): Notification[] {
  return [
    {
      id: 'n-1',
      kind: 'booking',
      title: 'Your stay is confirmed',
      body: 'Cliffside Cottage in Big Sur is booked for Jun 14–18. Tap to see check-in details.',
      created_at: hoursAgo(1),
      read: false,
    },
    {
      id: 'n-2',
      kind: 'message',
      title: 'New message from Mariko',
      body: '“Welcome! I’ve left a guide to my favourite ramen spots by the door.”',
      created_at: hoursAgo(3),
      read: false,
    },
    {
      id: 'n-3',
      kind: 'system',
      title: 'Concierge is standing by',
      body: 'Your 24/7 multilingual concierge is ready for this trip — ask anything, anytime.',
      created_at: hoursAgo(7),
      read: false,
    },
    {
      id: 'n-4',
      kind: 'review',
      title: 'How was Garden Loft, Kyoto?',
      body: 'Share a few words to help future guests — it takes about a minute.',
      created_at: hoursAgo(20),
      read: true,
    },
    {
      id: 'n-5',
      kind: 'booking',
      title: 'Check-in tomorrow',
      body: 'Seafront Apartment in Lisbon — self check-in opens at 3:00 PM. Directions are in your trip.',
      created_at: daysAgo(1),
      read: true,
    },
    {
      id: 'n-6',
      kind: 'message',
      title: 'Reply from your host',
      body: '“Of course — early check-in at 1 PM works. See you soon!”',
      created_at: daysAgo(2),
      read: true,
    },
    {
      id: 'n-7',
      kind: 'system',
      title: 'Price drop on a saved stay',
      body: 'A home in your Tokyo wishlist is now 12% lower for your dates.',
      created_at: daysAgo(3),
      read: true,
    },
    {
      id: 'n-8',
      kind: 'review',
      title: 'Mariko left you a review',
      body: 'You were a wonderful guest. See what your host wrote.',
      created_at: daysAgo(5),
      read: true,
    },
  ];
}

const EMPTY: NotificationsState = { items: [], seeded: false };

function freshState(): NotificationsState {
  return { items: seedItems(), seeded: true };
}

let cached: NotificationsState = readStorage();
const listeners = new Set<() => void>();

function readStorage(): NotificationsState {
  if (typeof window === 'undefined') return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<NotificationsState>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      seeded: parsed.seeded ?? true,
    };
  } catch {
    return freshState();
  }
}

function writeStorage(s: NotificationsState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // best-effort
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: NotificationsState) {
  cached = next;
  writeStorage(next);
  emit();
}

// --- mutators ---------------------------------------------------------------

export function markRead(id: string): void {
  commit({
    ...cached,
    items: cached.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
  });
}

export function markAllRead(): void {
  commit({
    ...cached,
    items: cached.items.map((n) => (n.read ? n : { ...n, read: true })),
  });
}

export function clearAll(): void {
  commit({ items: [], seeded: true });
}

/** Restore the seeded inbox (handy for the preview / demos). */
export function resetNotifications(): void {
  commit(freshState());
}

// --- reads ------------------------------------------------------------------

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): NotificationsState {
  return cached;
}

// localStorage isn't available during SSR; render from the seed so the first
// paint matches what a fresh client shows.
const SERVER_STATE = freshState();
function serverSnapshot(): NotificationsState {
  return SERVER_STATE;
}

function useNotificationsState(): NotificationsState {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** All notifications, newest first. */
export function useNotifications(): Notification[] {
  return useNotificationsState().items;
}

/** Count of unread notifications — drives the TopNav badge. */
export function useUnreadCount(): number {
  return useNotificationsState().items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
}
