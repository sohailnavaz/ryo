'use client';

// Guest↔host messaging. (migration 0013)
//
// Real-only: messaging is inherently between two authenticated parties, so there is no
// localStorage fallback — signed out, you see nothing and the compose actions refuse.
// One surface serves both sides: RLS returns threads where you are the guest OR the
// host, so a single `/messages` inbox works for everyone with no role branching.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase, tryGetSupabase } from './client';
import { useSession } from './auth';

export type MessageThread = {
  id: string;
  guest_id: string;
  host_id: string;
  listing_id: string | null;
  booking_id: string | null;
  subject: string;
  created_at: string;
  last_message_at: string;
  guest_unread: number;
  host_unread: number;
  // Joined for display — the OTHER participant, from my point of view.
  other_name: string;
  other_avatar: string | null;
  last_body: string | null;
  my_unread: number;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  mine: boolean;
  sender_name: string;
};

function realSession(user: ReturnType<typeof useSession>['user']): boolean {
  const isDemo = (user?.app_metadata as { demo?: boolean } | undefined)?.demo === true;
  return Boolean(user) && !isDemo && Boolean(tryGetSupabase());
}

/** My inbox — every thread I'm a participant in, newest activity first. */
export function useThreads() {
  const { user } = useSession();
  const enabled = realSession(user);
  const uid = user?.id;

  return useQuery<MessageThread[]>({
    queryKey: ['message-threads', uid],
    enabled,
    refetchInterval: 15_000, // light polling stands in for realtime until we add it
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('message_threads')
        .select(
          `id, guest_id, host_id, listing_id, booking_id, subject, created_at,
           last_message_at, guest_unread, host_unread,
           guest:profiles!message_threads_guest_id_fkey ( full_name, avatar_url ),
           host:profiles!message_threads_host_id_fkey ( full_name, avatar_url ),
           messages ( body, created_at )`,
        )
        .order('last_message_at', { ascending: false });
      if (error) throw error;

      return (data ?? []).map((t: Record<string, unknown>) => {
        const iAmGuest = t.guest_id === uid;
        const other = (iAmGuest ? t.host : t.guest) as { full_name?: string; avatar_url?: string } | null;
        const msgs = ((t.messages as Array<{ body: string; created_at: string }>) ?? [])
          .slice()
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
        return {
          id: t.id as string,
          guest_id: t.guest_id as string,
          host_id: t.host_id as string,
          listing_id: (t.listing_id as string) ?? null,
          booking_id: (t.booking_id as string) ?? null,
          subject: (t.subject as string) ?? '',
          created_at: t.created_at as string,
          last_message_at: t.last_message_at as string,
          guest_unread: t.guest_unread as number,
          host_unread: t.host_unread as number,
          other_name: other?.full_name ?? 'Ryo member',
          other_avatar: other?.avatar_url ?? null,
          last_body: msgs[0]?.body ?? null,
          my_unread: (iAmGuest ? t.guest_unread : t.host_unread) as number,
        };
      });
    },
  });
}

/** Total unread across my threads — for a nav badge. */
export function useMessagesUnreadCount(): number {
  const { data } = useThreads();
  return (data ?? []).reduce((n, t) => n + t.my_unread, 0);
}

/** One conversation. Marks it read on open. */
export function useThread(threadId: string | undefined) {
  const { user } = useSession();
  const uid = user?.id;
  const qc = useQueryClient();

  return useQuery<{ thread: MessageThread | null; messages: Message[] }>({
    queryKey: ['message-thread', threadId],
    enabled: realSession(user) && Boolean(threadId),
    refetchInterval: 8_000,
    queryFn: async () => {
      const supabase = getSupabase();
      const { data: t, error: te } = await supabase
        .from('message_threads')
        .select(
          `id, guest_id, host_id, listing_id, booking_id, subject, created_at,
           last_message_at, guest_unread, host_unread,
           guest:profiles!message_threads_guest_id_fkey ( full_name, avatar_url ),
           host:profiles!message_threads_host_id_fkey ( full_name, avatar_url )`,
        )
        .eq('id', threadId!)
        .maybeSingle();
      if (te) throw te;
      if (!t) return { thread: null, messages: [] };

      const { data: m, error: me } = await supabase
        .from('messages')
        .select('id, thread_id, sender_id, body, created_at, sender:profiles!messages_sender_id_fkey ( full_name )')
        .eq('thread_id', threadId!)
        .order('created_at');
      if (me) throw me;

      // Clear my unread counter now that I'm looking at it.
      await supabase.rpc('mark_thread_read', { p_thread: threadId });
      qc.invalidateQueries({ queryKey: ['message-threads'] });

      const iAmGuest = (t as Record<string, unknown>).guest_id === uid;
      const other = (iAmGuest ? (t as Record<string, unknown>).host : (t as Record<string, unknown>).guest) as
        | { full_name?: string; avatar_url?: string }
        | null;

      return {
        thread: {
          id: (t as Record<string, unknown>).id as string,
          guest_id: (t as Record<string, unknown>).guest_id as string,
          host_id: (t as Record<string, unknown>).host_id as string,
          listing_id: ((t as Record<string, unknown>).listing_id as string) ?? null,
          booking_id: ((t as Record<string, unknown>).booking_id as string) ?? null,
          subject: ((t as Record<string, unknown>).subject as string) ?? '',
          created_at: (t as Record<string, unknown>).created_at as string,
          last_message_at: (t as Record<string, unknown>).last_message_at as string,
          guest_unread: (t as Record<string, unknown>).guest_unread as number,
          host_unread: (t as Record<string, unknown>).host_unread as number,
          other_name: other?.full_name ?? 'Ryo member',
          other_avatar: other?.avatar_url ?? null,
          last_body: null,
          my_unread: 0,
        },
        messages: (m ?? []).map((x: Record<string, unknown>) => ({
          id: x.id as string,
          thread_id: x.thread_id as string,
          sender_id: x.sender_id as string,
          body: x.body as string,
          created_at: x.created_at as string,
          mine: x.sender_id === uid,
          sender_name: ((x.sender as { full_name?: string } | null)?.full_name) ?? 'Member',
        })),
      };
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const supabase = getSupabase();
      const { data: s } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('messages')
        .insert({ thread_id: threadId, sender_id: s.user!.id, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ['message-thread', v.threadId] });
      qc.invalidateQueries({ queryKey: ['message-threads'] });
    },
  });
}

/**
 * Guest opens (or reuses) a thread with a host and sends the first message.
 * Reuses an existing thread for the same (guest, host, listing) so a guest doesn't
 * spawn a new thread every question. Returns the thread id.
 */
export function useStartThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      hostId,
      listingId,
      subject,
      body,
    }: {
      hostId: string;
      listingId?: string;
      subject?: string;
      body: string;
    }): Promise<string> => {
      const supabase = getSupabase();
      const { data: s } = await supabase.auth.getUser();
      const guestId = s.user!.id;

      // Reuse an existing thread for this guest+host+listing if one exists.
      let query = supabase
        .from('message_threads')
        .select('id')
        .eq('guest_id', guestId)
        .eq('host_id', hostId);
      query = listingId ? query.eq('listing_id', listingId) : query.is('listing_id', null);
      const { data: existing } = await query.maybeSingle();

      let threadId = (existing as { id: string } | null)?.id;
      if (!threadId) {
        const { data: created, error } = await supabase
          .from('message_threads')
          .insert({
            guest_id: guestId,
            host_id: hostId,
            listing_id: listingId ?? null,
            subject: subject ?? '',
          })
          .select('id')
          .single();
        if (error) throw error;
        threadId = (created as { id: string }).id;
      }

      const { error: me } = await supabase
        .from('messages')
        .insert({ thread_id: threadId, sender_id: guestId, body: body.trim() });
      if (me) throw me;
      return threadId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message-threads'] }),
  });
}
