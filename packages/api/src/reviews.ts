import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Review } from '@bnb/db';
import { getSupabase, tryGetSupabase } from './client';
import {
  deleteReviewDraft,
  getReviewDraft,
  saveReviewDraft,
  type ReviewDraft,
} from './review-drafts-store';

/** A host's reply to a guest review (one per review). */
export type HostReviewReply = {
  review_id: string;
  host_id: string;
  body: string;
  created_at: string;
};

/** A guest review plus its optional host reply (joined in `fetchReviews`). */
export type ReviewWithReply = Review & { host_reply?: HostReviewReply };

export async function fetchReviews(listingId: string): Promise<ReviewWithReply[]> {
  const { data, error } = await getSupabase()
    .from('reviews')
    .select(`id, listing_id, guest_id, rating, body, created_at,
             guest:profiles ( full_name, avatar_url ),
             reply:host_review_replies ( review_id, host_id, body, created_at )`)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as Array<
      Review & {
        guest?: { full_name: string | null; avatar_url: string | null };
        reply?: HostReviewReply | HostReviewReply[] | null;
      }
    >
  ).map((r) => {
    const reply = Array.isArray(r.reply) ? r.reply[0] : r.reply;
    return {
      ...r,
      author_name: r.guest?.full_name ?? 'Guest',
      author_avatar: r.guest?.avatar_url ?? undefined,
      host_reply: reply ?? undefined,
    };
  });
}

export function useReviews(listingId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: () => fetchReviews(listingId!),
    enabled: !!listingId,
  });
}

// --- "my review" read (real when signed in, local draft otherwise) ----------

/** The current guest's review for one completed booking, normalised to the
 *  same shape regardless of source. `isDraft` is true when it came from the
 *  local demo/offline store rather than a persisted `reviews` row. */
export type MyReview = {
  booking_id: string;
  listing_id: string;
  listing_title: string;
  rating: number;
  body: string;
  created_at: string;
  /** True → local fallback (demo / unconfigured); false → persisted in Supabase. */
  isDraft: boolean;
};

function draftToMyReview(d: ReviewDraft): MyReview {
  return {
    booking_id: d.booking_id,
    listing_id: d.listing_id,
    listing_title: d.listing_title,
    rating: d.rating,
    body: d.body,
    created_at: d.created_at,
    isDraft: true,
  };
}

/** Read the current guest's review for a booking. When a real user is signed in,
 *  prefers the persisted `reviews` row (matched on listing_id + guest_id); when
 *  there is no real session (demo / unconfigured), falls back to the local
 *  review-draft store so demo accounts still see their review. */
export async function fetchMyReview(input: {
  bookingId: string;
  listingId: string;
  listingTitle: string;
}): Promise<MyReview | null> {
  const supabase = tryGetSupabase();
  const localDraft = getReviewDraft(input.bookingId);

  if (!supabase) {
    return localDraft ? draftToMyReview(localDraft) : null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No real session → demo mode: use the local draft store.
  if (!user) {
    return localDraft ? draftToMyReview(localDraft) : null;
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('id, listing_id, guest_id, rating, body, created_at')
    .eq('listing_id', input.listingId)
    .eq('guest_id', user.id)
    .maybeSingle();

  if (error || !data) {
    // No persisted review (or read failed) → fall back to any local draft.
    return localDraft ? draftToMyReview(localDraft) : null;
  }

  const row = data as Pick<Review, 'listing_id' | 'rating' | 'body' | 'created_at'>;
  return {
    booking_id: input.bookingId,
    listing_id: row.listing_id,
    listing_title: input.listingTitle,
    rating: row.rating,
    body: row.body,
    created_at: row.created_at,
    isDraft: false,
  };
}

/** The current guest's review for a completed booking (real or local draft). */
export function useMyReview(input: {
  bookingId: string | undefined;
  listingId: string | undefined;
  listingTitle: string | undefined;
}) {
  return useQuery({
    queryKey: ['my-review', input.bookingId],
    queryFn: () =>
      fetchMyReview({
        bookingId: input.bookingId!,
        listingId: input.listingId!,
        listingTitle: input.listingTitle ?? '',
      }),
    enabled: !!input.bookingId && !!input.listingId,
  });
}

// --- submit / delete (real when signed in, local draft otherwise) -----------

export type SubmitReviewInput = {
  booking_id: string;
  listing_id: string;
  listing_title: string;
  rating: number;
  body: string;
};

/** Result of submitting a review — `persisted` is true when it was written to
 *  Supabase, false when it was saved to the local demo/offline store. */
export type SubmitReviewResult = { persisted: boolean };

export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const body = input.body.trim();
  const supabase = tryGetSupabase();

  // No client configured → demo/offline: local draft store only.
  if (!supabase) {
    saveReviewDraft({ ...input, rating, body });
    return { persisted: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No real session (demo mode) → keep using the local draft store.
  if (!user) {
    saveReviewDraft({ ...input, rating, body });
    return { persisted: false };
  }

  // Real user: one review per guest+listing. Update the existing row if present,
  // otherwise insert a new one (RLS enforces verified-stay on insert).
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('listing_id', input.listing_id)
    .eq('guest_id', user.id)
    .maybeSingle();

  if (existing && (existing as { id: string }).id) {
    const { error } = await supabase
      .from('reviews')
      .update({ rating, body })
      .eq('id', (existing as { id: string }).id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('reviews')
      .insert({ listing_id: input.listing_id, guest_id: user.id, rating, body });
    if (error) throw error;
  }

  // Best-effort cross-device draft sync (non-fatal if the table/RLS rejects it).
  await supabase
    .from('review_drafts')
    .upsert(
      {
        booking_id: input.booking_id,
        guest_id: user.id,
        listing_id: input.listing_id,
        listing_title: input.listing_title,
        rating,
        body,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'booking_id' },
    )
    .then(undefined, () => undefined);

  return { persisted: true };
}

/** Submit (create or update) the current guest's review for a completed stay.
 *  Persists to Supabase when a real user is signed in; otherwise saves to the
 *  local demo/offline draft store. Invalidates the listing's reviews and the
 *  guest's "my review" query on success. */
export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitReview,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['reviews', variables.listing_id] });
      qc.invalidateQueries({ queryKey: ['my-review', variables.booking_id] });
    },
  });
}

/** Remove the current guest's review for a completed booking. Deletes the
 *  persisted Supabase row when a real user is signed in; otherwise removes the
 *  local draft. Returns whether the deletion hit Supabase. */
export async function removeReview(input: {
  booking_id: string;
  listing_id: string;
}): Promise<SubmitReviewResult> {
  const supabase = tryGetSupabase();
  if (!supabase) {
    deleteReviewDraft(input.booking_id);
    return { persisted: false };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    deleteReviewDraft(input.booking_id);
    return { persisted: false };
  }
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('listing_id', input.listing_id)
    .eq('guest_id', user.id);
  if (error) throw error;
  await supabase
    .from('review_drafts')
    .delete()
    .eq('booking_id', input.booking_id)
    .then(undefined, () => undefined);
  return { persisted: true };
}

/** Delete the current guest's review (real row when signed in, else local draft). */
export function useRemoveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeReview,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['reviews', variables.listing_id] });
      qc.invalidateQueries({ queryKey: ['my-review', variables.booking_id] });
    },
  });
}
