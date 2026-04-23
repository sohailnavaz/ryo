import { useQuery } from '@tanstack/react-query';
import type { Review } from '@bnb/db';
import { getSupabase } from './client';

export async function fetchReviews(listingId: string): Promise<Review[]> {
  const { data, error } = await getSupabase()
    .from('reviews')
    .select(`id, listing_id, guest_id, rating, body, created_at,
             guest:profiles ( full_name, avatar_url )`)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Array<Review & { guest?: { full_name: string | null; avatar_url: string | null } }>).map(
    (r) => ({
      ...r,
      author_name: r.guest?.full_name ?? 'Guest',
      author_avatar: r.guest?.avatar_url ?? undefined,
    }),
  );
}

export function useReviews(listingId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: () => fetchReviews(listingId!),
    enabled: !!listingId,
  });
}
