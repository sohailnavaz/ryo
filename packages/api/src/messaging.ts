// Real guest <-> host messaging, backed by Supabase (migration 0006_messaging.sql).
//
// Replaces the fully-synthetic host inbox in host.ts. Follows the bookings.ts
// conventions: `tryGetSupabase()` on reads (fail soft when unconfigured),
// `getSupabase()` on writes, and the real session resolved via
// `supabase.auth.getUser()`. Demo identities (app_metadata.demo === true) are
// excluded so the demo inbox keeps its synthetic fallback in host.ts.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Session helper — a *real* Supabase user id, or null for demo / unconfigured.
// Mirrors notifications-store.ts so the synthetic fallback owns demo accounts.
// ---------------------------------------------------------------------------
export async function realMessagingUserId(): Promise<string | null> {
  const supabase = tryGetSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if ((user.app_metadata as { demo?: boolean } | undefined)?.demo === true) return null;
  return user.id;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A thread summary as seen by the current user — with the *other* participant's
 *  identity resolved and an unread count of their messages to me. */
export type Thread = {
  id: string;
  listing_id: string;
  listing_title: string;
  booking_id: string | null;
  /** The current user's role in this thread. */
  role: 'guest' | 'host';
  /** The other participant (guest if I'm the host, host if I'm the guest). */
  other_id: string;
  other_name: string;
  other_avatar: string | null;
  last_message_at: string;
  created_at: string;
  /** Unread messages sent by the other party (read_at is null, sender != me). */
  unread_count: number;
};

/** One message in a thread. */
export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  /** Convenience: true when the current user sent this message. */
  mine: boolean;
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

type ProfileLite = { id: string; full_name: string | null; avatar_url: string | null };

type ThreadRow = {
  id: string;
  listing_id: string;
  booking_id: string | null;
  guest_id: string;
  host_id: string;
  last_message_at: string;
  created_at: string;
  listing?: { title: string | null } | null;
  guest?: ProfileLite | null;
  host?: ProfileLite | null;
};

/** Fetch the current user's threads (as guest OR host), newest first. Returns
 *  `null` when there is no real session (caller falls back to synthetic). */
export async function fetchThreads(): Promise<Thread[] | null> {
  const uid = await realMessagingUserId();
  if (!uid) return null;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('message_threads')
    .select(
      `id, listing_id, booking_id, guest_id, host_id, last_message_at, created_at,
       listing:listings ( title ),
       guest:profiles!message_threads_guest_id_fkey ( id, full_name, avatar_url ),
       host:profiles!message_threads_host_id_fkey ( id, full_name, avatar_url )`,
    )
    .or(`guest_id.eq.${uid},host_id.eq.${uid}`)
    .order('last_message_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as ThreadRow[];
  if (rows.length === 0) return [];

  // Unread counts: the other party's messages to me that I haven't read.
  const ids = rows.map((t) => t.id);
  const { data: unreadRows, error: uErr } = await supabase
    .from('messages')
    .select('thread_id, sender_id, read_at')
    .in('thread_id', ids)
    .is('read_at', null)
    .neq('sender_id', uid);
  if (uErr) throw uErr;

  const unreadByThread = new Map<string, number>();
  for (const m of (unreadRows ?? []) as Array<{ thread_id: string }>) {
    unreadByThread.set(m.thread_id, (unreadByThread.get(m.thread_id) ?? 0) + 1);
  }

  return rows.map((t) => {
    const isHost = t.host_id === uid;
    const other = isHost ? t.guest : t.host;
    return {
      id: t.id,
      listing_id: t.listing_id,
      listing_title: t.listing?.title ?? 'Listing',
      booking_id: t.booking_id,
      role: isHost ? 'host' : 'guest',
      other_id: isHost ? t.guest_id : t.host_id,
      other_name: other?.full_name ?? (isHost ? 'Guest' : 'Host'),
      other_avatar: other?.avatar_url ?? null,
      last_message_at: t.last_message_at,
      created_at: t.created_at,
      unread_count: unreadByThread.get(t.id) ?? 0,
    } satisfies Thread;
  });
}

/** The current user's message threads (guest + host), newest by last_message_at.
 *  Disabled-equivalent when unconfigured: `fetchThreads` returns null. */
export function useThreads() {
  return useQuery({
    queryKey: ['messaging', 'threads'],
    queryFn: fetchThreads,
    staleTime: 30_000,
  });
}

type MessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/** Fetch all messages in a thread (created_at ascending). Returns `null` when
 *  there is no real session. */
export async function fetchThreadMessages(threadId: string): Promise<Message[] | null> {
  const uid = await realMessagingUserId();
  if (!uid) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('messages')
    .select('id, thread_id, sender_id, body, read_at, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as MessageRow[]).map((m) => ({ ...m, mine: m.sender_id === uid }));
}

/** Messages in one thread, oldest first. */
export function useThread(threadId: string | undefined) {
  return useQuery({
    queryKey: ['messaging', 'thread', threadId],
    enabled: !!threadId,
    queryFn: () => fetchThreadMessages(threadId!),
    staleTime: 15_000,
  });
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Insert a message into a thread (sender_id = current user). */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { threadId: string; body: string }) => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('messages')
        .insert({ thread_id: v.threadId, sender_id: user.id, body: v.body })
        .select('id, thread_id, sender_id, body, read_at, created_at')
        .single();
      if (error) throw error;
      const row = data as MessageRow;
      return { ...row, mine: true } satisfies Message;
    },
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: ['messaging', 'thread', v.threadId] });
      qc.invalidateQueries({ queryKey: ['messaging', 'threads'] });
    },
  });
}

/** Find-or-create a thread for (guest, host, listing[, booking]) and return its
 *  id. Used both for a guest-initiated inquiry and a host opening from a booking.
 *  The UNIQUE(guest_id, host_id, listing_id) constraint guarantees one thread. */
export function useStartThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      guestId: string;
      hostId: string;
      listingId: string;
      bookingId?: string | null;
    }): Promise<string> => {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      // Existing thread? (guest_id, host_id, listing_id) is unique.
      const { data: existing, error: findErr } = await supabase
        .from('message_threads')
        .select('id')
        .eq('guest_id', v.guestId)
        .eq('host_id', v.hostId)
        .eq('listing_id', v.listingId)
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) return (existing as { id: string }).id;

      const { data, error } = await supabase
        .from('message_threads')
        .insert({
          guest_id: v.guestId,
          host_id: v.hostId,
          listing_id: v.listingId,
          booking_id: v.bookingId ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messaging', 'threads'] });
    },
  });
}

/** Mark the other party's unread messages in a thread as read. No-op when there
 *  is no real session. */
export function useMarkThreadRead(threadId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!threadId) return;
      const uid = await realMessagingUserId();
      if (!uid) return;
      const supabase = getSupabase();
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .neq('sender_id', uid)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      if (threadId) qc.invalidateQueries({ queryKey: ['messaging', 'thread', threadId] });
      qc.invalidateQueries({ queryKey: ['messaging', 'threads'] });
    },
  });
}
