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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';

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

// ===========================================================================
// Real, per-user backing (Supabase `notifications` table).
//
// When there's a REAL signed-in Supabase session, the inbox reads + writes the
// per-user `notifications` table (RLS: self-only). When there's NO real user
// (demo sign-in / unconfigured Supabase), everything above (the localStorage
// seeded store) stays in charge, so demo accounts still see a populated inbox.
//
// The `useNotificationsInbox()` hook below unifies both: it returns the same
// shape regardless of path, plus an `isPreview` flag and async-safe mutators.
// Existing sync hooks (`useNotifications` / `useUnreadCount`) are preserved for
// the demo path and as the SSR/first-paint snapshot.
// ===========================================================================

/** A row in the `notifications` table. Mirrors `Notification` plus the owner. */
type NotificationRow = {
  id: string;
  profile_id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

function rowToNotification(r: NotificationRow): Notification {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    created_at: r.created_at,
    read: r.read,
  };
}

/** A *real* Supabase user id, or null for demo / unconfigured. Demo identities
 *  carry `app_metadata.demo === true`; only genuine sessions hit the table. */
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

const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

/** Server-backed fetch: returns this user's notifications (newest first), or
 *  `null` when there is no real session (caller falls back to the local store). */
export async function fetchNotifications(): Promise<Notification[] | null> {
  const uid = await realUserId();
  if (!uid) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, profile_id, kind, title, body, read, created_at')
    .eq('profile_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as NotificationRow[]).map(rowToNotification);
}

async function markReadRemote(id: string): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('profile_id', uid);
  if (error) throw error;
}

async function markAllReadRemote(): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('profile_id', uid)
    .eq('read', false);
  if (error) throw error;
}

async function clearAllRemote(): Promise<void> {
  const uid = await realUserId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase.from('notifications').delete().eq('profile_id', uid);
  if (error) throw error;
}

/** The unified inbox state returned by `useNotificationsInbox()`. */
export type NotificationsInbox = {
  /** All notifications, newest first. */
  items: Notification[];
  /** Count of unread items — drives the TopNav badge. */
  unread: number;
  /** True while the real-backed query is loading its first result. */
  isLoading: boolean;
  /** True when serving the seeded localStorage store (demo / unconfigured). */
  isPreview: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

/**
 * Unified guest-notifications inbox.
 *
 * - Real signed-in user → reads/writes the per-user `notifications` table.
 * - Demo / unconfigured → falls back to the seeded localStorage store, so demo
 *   accounts still see a populated inbox and the existing mutators keep working.
 *
 * Both paths expose the same shape, so consumers don't branch on auth.
 */
export function useNotificationsInbox(): NotificationsInbox {
  const qc = useQueryClient();

  // localStorage-backed snapshot (also the SSR / first-paint source).
  const local = useNotificationsState();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

  const markReadM = useMutation({ mutationFn: markReadRemote, onSuccess: invalidate });
  const markAllReadM = useMutation({ mutationFn: markAllReadRemote, onSuccess: invalidate });
  const clearAllM = useMutation({ mutationFn: clearAllRemote, onSuccess: invalidate });

  // `query.data === null` means "no real session" → use the local store.
  const isReal = Array.isArray(query.data);

  if (isReal) {
    const items = query.data as Notification[];
    return {
      items,
      unread: items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
      isLoading: query.isLoading,
      isPreview: false,
      markRead: (id) => markReadM.mutate(id),
      markAllRead: () => markAllReadM.mutate(),
      clearAll: () => clearAllM.mutate(),
    };
  }

  // Demo / unconfigured fallback — the seeded localStorage store.
  return {
    items: local.items,
    unread: local.items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
    isLoading: query.isLoading && query.data === undefined,
    isPreview: true,
    markRead,
    markAllRead,
    clearAll,
  };
}

/** Convenience: unread count from the unified inbox (real or seeded). */
export function useInboxUnreadCount(): number {
  return useNotificationsInbox().unread;
}
