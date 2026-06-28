import { useState } from 'react';
import {
  useMyReview,
  useRemoveReview,
  useSubmitReview,
  type GuestBooking,
} from '@bnb/api';
import {
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Input,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { StarRating } from './StarRating';

export type ReviewCardProps = {
  booking: Pick<GuestBooking, 'id' | 'listing_id' | 'listing_title' | 'end_date'>;
};

/**
 * Write-a-review-after-stay card for a completed trip.
 *
 * - Gated to stays whose `end_date` is in the past (renders nothing otherwise).
 * - If the guest has already left a review (persisted in Supabase when signed in,
 *   or the local demo draft store otherwise) it shows "Your review" with an edit
 *   affordance.
 * - Otherwise it shows a star rating + text composer.
 */
export function ReviewCard({ booking }: ReviewCardProps) {
  const { data: existing } = useMyReview({
    bookingId: booking.id,
    listingId: booking.listing_id,
    listingTitle: booking.listing_title,
  });
  const submitReview = useSubmitReview();
  const removeReview = useRemoveReview();
  const today = new Date().toISOString().slice(0, 10);
  const isPastStay = booking.end_date < today;

  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? '');

  // Only completed (past) stays can be reviewed.
  if (!isPastStay) return null;

  const startEditing = () => {
    setRating(existing?.rating ?? 0);
    setBody(existing?.body ?? '');
    setEditing(true);
  };

  const submit = () => {
    if (rating < 1) {
      toast.error('Add a star rating before posting.');
      return;
    }
    submitReview.mutate(
      {
        booking_id: booking.id,
        listing_id: booking.listing_id,
        listing_title: booking.listing_title,
        rating,
        body,
      },
      {
        onSuccess: (result) => {
          setEditing(false);
          if (result.persisted) {
            toast.success('Thanks for your review.', {
              description: 'Your review is posted.',
            });
          } else {
            toast.success('Thanks for your review.', {
              description: 'Saved on this device — it syncs once you sign in.',
            });
          }
        },
        onError: () => {
          toast.error("We couldn't post your review. Please try again.");
        },
      },
    );
  };

  const remove = () => {
    removeReview.mutate(
      { booking_id: booking.id, listing_id: booking.listing_id },
      {
        onSuccess: () => {
          setEditing(false);
          setRating(0);
          setBody('');
          toast.success('Review removed.');
        },
        onError: () => {
          toast.error("We couldn't remove your review. Please try again.");
        },
      },
    );
  };

  // --- Already reviewed (and not editing) → "Your review" -------------------
  if (existing && !editing) {
    return (
      <Card className="p-5 gap-3">
        <HStack className="justify-between items-center">
          <Heading level={3}>Your review</Heading>
          <Text variant="caption">{existing.created_at.slice(0, 10)}</Text>
        </HStack>
        <Divider />
        <StarRating value={existing.rating} readonly size={22} />
        {existing.body ? (
          <Text className="text-ink-soft">{existing.body}</Text>
        ) : (
          <Text variant="small" className="text-ink-soft italic">
            You left a rating without a written note.
          </Text>
        )}
        <HStack className="gap-2">
          <Button
            title="Edit"
            variant="outline"
            size="sm"
            onPress={startEditing}
            disabled={submitReview.isPending || removeReview.isPending}
          />
          <Button
            title="Delete"
            variant="ghost"
            size="sm"
            onPress={remove}
            disabled={removeReview.isPending}
          />
        </HStack>
        {!existing.isDraft ? null : (
          <Text variant="caption">
            Saved on this device — it syncs once you sign in.
          </Text>
        )}
      </Card>
    );
  }

  // --- Composer (new review or editing) -------------------------------------
  return (
    <Card className="p-5 gap-3">
      <Heading level={3}>{existing ? 'Edit your review' : 'How was your stay?'}</Heading>
      <Text variant="small" className="text-ink-soft">
        Share a few words about {booking.listing_title}. Your honest take helps the next guest.
      </Text>
      <Divider />
      <VStack className="gap-2">
        <Text variant="label">Your rating</Text>
        <StarRating value={rating} onChange={setRating} />
      </VStack>
      <Input
        label="Your review"
        placeholder="What stood out — the host, the space, the neighbourhood?"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={4}
        className="min-h-[96px] py-2"
        style={{ textAlignVertical: 'top' }}
      />
      <HStack className="gap-2">
        <Button
          title={existing ? 'Save changes' : 'Post review'}
          onPress={submit}
          disabled={submitReview.isPending}
        />
        {existing ? (
          <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} />
        ) : null}
      </HStack>
    </Card>
  );
}
