'use client';

import { useState } from 'react';
import { View } from 'react-native';
import {
  newIdempotencyKey,
  previewAdminAction,
  useModerationQueue,
  useReasonCodes,
  useRunAdminAction,
  type AdminActionName,
  type AdminSubjectType,
  type ModerationListing,
  type ModerationReview,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  HStack,
  Pressable,
  ReasonCodeModal,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

// The moderation queue, on real data. (docs/15-admin-console.md, Phase 2)
//
// This screen used to render a HARDCODED array of two fake flagged reviews about
// listings that don't exist, and "approve" wrote to a localStorage override. It looked
// like a working moderation console and moderated nothing.
//
// Now it reads `admin_moderation_queue()` (listings whose moderation_status isn't
// approved, plus removed or low-rated reviews) and every decision goes through
// `admin_action()` — reason-coded, audited, atomic.

type Tab = 'listings' | 'reviews';

type Pending = {
  action: AdminActionName;
  subjectType: AdminSubjectType;
  subjectId: string;
  title: string;
  message: string;
  destructive: boolean;
};

export function AdminModerationScreen() {
  const [tab, setTab] = useState<Tab>('listings');
  const [pending, setPending] = useState<Pending | null>(null);

  const { data, isLoading } = useModerationQueue();
  const listingReasons = useReasonCodes('listing');
  const reviewReasons = useReasonCodes('review');
  const runAction = useRunAdminAction();

  const listings = data?.listings ?? [];
  const reviews = data?.reviews ?? [];

  async function askListing(l: ModerationListing, action: AdminActionName) {
    try {
      const p = await previewAdminAction({
        action,
        subjectType: 'listing',
        subjectId: l.id,
      });
      const b = p.blast_radius;
      const destructive = action !== 'listing.approve';

      setPending({
        action,
        subjectType: 'listing',
        subjectId: l.id,
        title:
          action === 'listing.approve'
            ? `Approve “${l.title}”?`
            : action === 'listing.reject'
              ? `Reject “${l.title}”?`
              : `Request changes on “${l.title}”?`,
        // Rejecting a listing with live bookings is a very different act from
        // rejecting an empty one. The server tells us which this is.
        message:
          destructive && b && b.upcoming_bookings > 0
            ? `${b.upcoming_bookings} upcoming booking(s) worth ${formatPrice(
                b.upcoming_booking_value_cents,
                'INR',
              )} are on this listing · ${b.guests_notified} guest(s) affected.`
            : 'No upcoming bookings are affected.',
        destructive,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not preview that decision.');
    }
  }

  function askReview(r: ModerationReview, action: AdminActionName) {
    setPending({
      action,
      subjectType: 'review',
      subjectId: r.id,
      title: action === 'review.remove' ? 'Remove this review?' : 'Restore this review?',
      message:
        action === 'review.remove'
          ? 'It disappears from the listing page. The author is not told which staff member removed it.'
          : 'It becomes visible on the listing page again.',
      destructive: action === 'review.remove',
    });
  }

  async function commit(reason_code: string, note: string) {
    if (!pending) return;
    try {
      await runAction.mutateAsync({
        action: pending.action,
        subjectType: pending.subjectType,
        subjectId: pending.subjectId,
        reasonCode: reason_code,
        note,
        idempotencyKey: newIdempotencyKey(),
      });
      toast.success('Decision recorded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That decision did not complete.');
    } finally {
      setPending(null);
    }
  }

  const reasons = pending?.subjectType === 'review' ? reviewReasons.data : listingReasons.data;

  return (
    <AdminShell
      title="Moderation"
      subtitle="Listings awaiting a decision, and reviews that need a human."
    >
      <HStack className="mt-6 gap-2">
        {(['listings', 'reviews'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)}>
            <View
              className={`px-3.5 py-2 rounded-full border ${
                tab === t ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
              }`}
            >
              <Text variant="small" className={tab === t ? 'text-surface font-semibold' : 'text-ink-soft'}>
                {t === 'listings' ? `Listings · ${listings.length}` : `Reviews · ${reviews.length}`}
              </Text>
            </View>
          </Pressable>
        ))}
      </HStack>

      <View className="mt-4">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : tab === 'listings' ? (
          listings.length === 0 ? (
            <Empty
              title="Queue is clear"
              text="No listing is waiting on a decision. That is the correct state most days."
            />
          ) : (
            <VStack className="gap-3">
              {listings.map((l) => (
                <Card key={l.id} className="p-5">
                  <HStack className="justify-between items-start gap-4 flex-wrap">
                    <VStack className="flex-1 gap-1 min-w-[220px]">
                      <HStack className="gap-2 items-center flex-wrap">
                        <Text className="font-semibold">{l.title}</Text>
                        <Badge variant="brand">{l.moderation_status}</Badge>
                      </HStack>
                      <Text variant="small" className="text-ink-soft">
                        {l.city}, {l.country} · {formatPrice(l.price_cents, l.currency)} / night
                      </Text>
                      <Text variant="small" className="text-ink-soft">
                        Host: {l.host_name} · submitted{' '}
                        {new Date(l.created_at).toLocaleDateString()}
                      </Text>
                      {l.moderation_note ? (
                        <Text variant="small" className="text-ink-soft">
                          Last note: “{l.moderation_note}”
                        </Text>
                      ) : null}
                    </VStack>

                    <HStack className="gap-2 flex-wrap">
                      <Button size="sm" onPress={() => askListing(l, 'listing.approve')}>
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => askListing(l, 'listing.request_changes')}
                      >
                        Changes…
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => askListing(l, 'listing.reject')}
                      >
                        Reject…
                      </Button>
                    </HStack>
                  </HStack>
                </Card>
              ))}
            </VStack>
          )
        ) : reviews.length === 0 ? (
          <Empty title="Nothing flagged" text="No review needs a human right now." />
        ) : (
          <VStack className="gap-3">
            {reviews.map((r) => (
              <Card key={r.id} className="p-5">
                <HStack className="justify-between items-start gap-4 flex-wrap">
                  <VStack className="flex-1 gap-1 min-w-[220px]">
                    <HStack className="gap-2 items-center flex-wrap">
                      <Text className="font-semibold">{r.listing_title}</Text>
                      <Badge variant="neutral">{r.rating}★</Badge>
                      {r.status === 'removed' ? <Badge variant="brand">removed</Badge> : null}
                    </HStack>
                    <Text variant="small" className="text-ink-soft">
                      {r.author} · {new Date(r.created_at).toLocaleDateString()}
                    </Text>
                    <Text variant="small" className="mt-1">
                      “{r.body}”
                    </Text>
                  </VStack>

                  <HStack className="gap-2">
                    {r.status === 'removed' ? (
                      <Button variant="outline" size="sm" onPress={() => askReview(r, 'review.restore')}>
                        Restore…
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onPress={() => askReview(r, 'review.remove')}>
                        Remove…
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </Card>
            ))}
          </VStack>
        )}
      </View>

      <ReasonCodeModal
        open={pending !== null}
        onClose={() => setPending(null)}
        onSubmit={({ reason_code, note }) => commit(reason_code, note)}
        title={pending?.title ?? ''}
        message={pending?.message}
        reasonCodes={(reasons ?? []).map((r) => ({ code: r.code, label: r.label }))}
        confirmLabel="Confirm"
        destructive={pending?.destructive}
        loading={runAction.isPending}
      />
    </AdminShell>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <Card className="p-10 items-center">
      <Text className="font-semibold">{title}</Text>
      <Text variant="small" className="text-ink-soft mt-1 text-center">
        {text}
      </Text>
    </Card>
  );
}
