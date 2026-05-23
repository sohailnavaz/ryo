import { useState } from 'react';
import { View } from 'react-native';
import {
  useAdminDashboard,
  useAdminModerateListing,
  useAdminModerateReview,
  useAdminOverrides,
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
import { AdminShell } from './shell';

type Tab = 'listings' | 'reviews';

const FLAGGED_REVIEWS = [
  {
    id: 'r-101',
    listing_title: 'Cliffside villa, Positano',
    guest_name: 'Alex Patel',
    rating: 1,
    body: 'Hosts seemed nice but the political flyers on the fridge were absolutely tasteless.',
    reason: 'Off-topic / political content',
  },
  {
    id: 'r-102',
    listing_title: 'Loft in Roma · Trastevere',
    guest_name: 'Mei Chen',
    rating: 2,
    body: 'The shower drain had hair from a previous guest. We left after one night.',
    reason: 'Cleanliness — verified by photos',
  },
];

const REJECT_REASONS = [
  { code: 'photo_quality', label: 'Photo quality' },
  { code: 'address_mismatch', label: 'Address mismatch' },
  { code: 'prohibited', label: 'Prohibited listing' },
  { code: 'duplicate', label: 'Duplicate' },
  { code: 'incomplete', label: 'Incomplete info' },
  { code: 'other', label: 'Other' },
];

const REVIEW_REMOVE_REASONS = [
  { code: 'off_topic', label: 'Off-topic' },
  { code: 'pii', label: 'Contains PII' },
  { code: 'hate_speech', label: 'Hate speech' },
  { code: 'spam', label: 'Spam / fake' },
  { code: 'other', label: 'Other' },
];

export function AdminModerationScreen() {
  const { data, isLoading } = useAdminDashboard();
  const overrides = useAdminOverrides();
  const [tab, setTab] = useState<Tab>('listings');

  const liveReviews = FLAGGED_REVIEWS.filter((r) => !overrides.reviewModeration[r.id]);

  return (
    <AdminShell
      title="Moderation"
      subtitle="Approve, request changes, or reject. Bulk approvals are intentionally disabled."
    >
      <HStack className="mt-6 gap-2">
        <TabButton active={tab === 'listings'} onPress={() => setTab('listings')}>
          Listings ({data?.moderation.length ?? 0})
        </TabButton>
        <TabButton active={tab === 'reviews'} onPress={() => setTab('reviews')}>
          Reviews ({liveReviews.length})
        </TabButton>
      </HStack>

      <View className="mt-6">
        {isLoading || !data ? (
          <Skeleton className="h-[400px] w-full" />
        ) : tab === 'listings' ? (
          <ListingsQueue items={data.moderation} />
        ) : (
          <ReviewsQueue items={liveReviews} />
        )}
      </View>
    </AdminShell>
  );
}

function TabButton({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        active ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
      }`}
    >
      <Text variant="small" className={active ? 'text-white font-semibold' : 'text-ink'}>
        {children}
      </Text>
    </Pressable>
  );
}

type ModerationItem = NonNullable<
  ReturnType<typeof useAdminDashboard>['data']
>['moderation'][number];

function ListingsQueue({ items }: { items: ModerationItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="p-8 items-center">
        <Text className="text-ink-soft">Inbox zero. Nothing to review.</Text>
      </Card>
    );
  }
  return (
    <VStack className="gap-3">
      {items.map((m) => (
        <ListingModerationCard key={m.id} item={m} />
      ))}
    </VStack>
  );
}

function ListingModerationCard({ item }: { item: ModerationItem }) {
  const moderate = useAdminModerateListing();
  // null = no modal; otherwise the destructive decision awaiting a reason code.
  const [pending, setPending] = useState<'rejected' | 'changes_requested' | null>(null);

  const apply = (
    decision: 'approved' | 'rejected' | 'changes_requested',
    reason_code: string,
    note?: string,
  ) =>
    moderate.mutate(
      { itemId: item.id, listingId: item.listing_id, decision, reason_code, note },
      {
        onSuccess: () => {
          setPending(null);
          toast.success(
            decision === 'approved'
              ? 'Listing approved.'
              : decision === 'rejected'
                ? 'Listing rejected — host notified.'
                : 'Changes requested — host notified.',
          );
        },
        onError: () => toast.error('Could not update listing. Try again.'),
      },
    );

  return (
    <Card className="p-5">
      <ReasonCodeModal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending === 'rejected' ? `Reject “${item.listing_title}”?` : `Request changes?`}
        message={
          pending === 'rejected'
            ? 'Removes the listing from the queue and notifies the host with your reason.'
            : 'Sends the listing back to the host with required changes.'
        }
        reasonCodes={REJECT_REASONS}
        requireNote
        confirmLabel={pending === 'rejected' ? 'Reject' : 'Request changes'}
        destructive={pending === 'rejected'}
        loading={moderate.isPending}
        onSubmit={({ reason_code, note }) =>
          apply(pending ?? 'changes_requested', reason_code, note || undefined)
        }
      />
      <HStack className="justify-between gap-3">
        <VStack className="flex-1 gap-0.5">
          <Text className="font-semibold" numberOfLines={1}>{item.listing_title}</Text>
          <Text variant="small" className="text-ink-soft">
            {item.listing_city} · submitted {item.submitted_at}
          </Text>
          <Text variant="small" className="mt-1">{item.reason}</Text>
        </VStack>
        <Badge variant={item.state === 'in_review' ? 'brand' : 'dark'}>
          {item.state.replace('_', ' ')}
        </Badge>
      </HStack>
      <HStack className="mt-4 gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          loading={moderate.isPending}
          onPress={() => apply('approved', 'first_review_pass')}
        >
          Approve
        </Button>
        <Button variant="outline" size="sm" onPress={() => setPending('changes_requested')}>
          Request changes
        </Button>
        <Button variant="outline" size="sm" onPress={() => setPending('rejected')}>
          Reject
        </Button>
      </HStack>
    </Card>
  );
}

type FlaggedReview = (typeof FLAGGED_REVIEWS)[number];

function ReviewsQueue({ items }: { items: FlaggedReview[] }) {
  if (items.length === 0) {
    return (
      <Card className="p-8 items-center">
        <Text className="text-ink-soft">No flagged reviews. Queue is clear.</Text>
      </Card>
    );
  }
  return (
    <VStack className="gap-3">
      {items.map((r) => (
        <ReviewModerationCard key={r.id} review={r} />
      ))}
    </VStack>
  );
}

function ReviewModerationCard({ review }: { review: FlaggedReview }) {
  const moderate = useAdminModerateReview();
  const [removeOpen, setRemoveOpen] = useState(false);

  return (
    <Card className="p-5">
      <ReasonCodeModal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove this review?"
        message="Hides the review from the listing. The author is notified of the policy basis."
        reasonCodes={REVIEW_REMOVE_REASONS}
        requireNote
        confirmLabel="Remove"
        destructive
        loading={moderate.isPending}
        onSubmit={({ reason_code, note }) =>
          moderate.mutate(
            { reviewId: review.id, decision: 'removed', reason_code, note: note || undefined },
            {
              onSuccess: () => {
                setRemoveOpen(false);
                toast.success('Review removed.');
              },
              onError: () => toast.error('Could not remove. Try again.'),
            },
          )
        }
      />
      <HStack className="justify-between gap-3">
        <VStack className="flex-1 gap-0.5">
          <Text className="font-semibold">{review.guest_name}</Text>
          <Text variant="small" className="text-ink-soft">
            {review.listing_title} · ★ {review.rating}/5
          </Text>
        </VStack>
        <Badge variant="brand">flagged</Badge>
      </HStack>
      <Text className="mt-3 text-ink-soft">{review.body}</Text>
      <View className="mt-3 rounded-xl bg-surface-alt px-3 py-2">
        <Text variant="small" className="text-ink-soft">
          <Text className="font-semibold">Reporter:</Text> {review.reason}
        </Text>
      </View>
      <HStack className="mt-4 gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          loading={moderate.isPending}
          onPress={() =>
            moderate.mutate(
              { reviewId: review.id, decision: 'kept', reason_code: 'within_policy' },
              {
                onSuccess: () => toast.success('Review kept.'),
                onError: () => toast.error('Could not update. Try again.'),
              },
            )
          }
        >
          Keep
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPress={() => toast.info('Preview only — inline review editor lands with rich text.')}
        >
          Edit
        </Button>
        <Button variant="outline" size="sm" onPress={() => setRemoveOpen(true)}>
          Remove
        </Button>
      </HStack>
    </Card>
  );
}
