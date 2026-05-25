import { useState } from 'react';
import { View } from 'react-native';
import {
  DEMO_HOST_ID,
  useHostReplyToReview,
  useHostReviews,
  type SyntheticReview,
} from '@bnb/api';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Input,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { HostShell } from './shell';

export function HostReviewsScreen({ hostId = DEMO_HOST_ID }: { hostId?: string }) {
  const { data, isLoading } = useHostReviews(hostId);

  return (
    <HostShell
      title="Reviews"
      subtitle="What guests are saying. Trend by month; full reviews below."
    >
      {isLoading || !data ? (
        <Skeleton className="mt-6 h-[400px] w-full" />
      ) : (
        <>
          <View className="mt-6 flex-row flex-wrap gap-4">
            <Card className="flex-1 min-w-[180px] p-5">
              <Text variant="small" className="text-ink-soft">Average</Text>
              <Heading level={2} className="mt-2">★ {data.average.toFixed(2)}</Heading>
              <Text variant="small" className="text-ink-soft mt-1">
                {data.total} total reviews
              </Text>
            </Card>
            <Card className="flex-[2] min-w-[280px] p-5">
              <Text variant="small" className="text-ink-soft">Last 6 months</Text>
              <TrendChart points={data.by_month} />
            </Card>
          </View>

          <View className="mt-10">
            <Heading level={2}>Reviews received</Heading>
            <VStack className="mt-3 gap-3">
              {data.reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </VStack>
          </View>
        </>
      )}
    </HostShell>
  );
}

function ReviewCard({ review: r }: { review: SyntheticReview }) {
  const reply = useHostReplyToReview();
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState('');

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    reply.mutate(
      { reviewId: r.id, body: trimmed },
      {
        onSuccess: () => {
          setComposing(false);
          setBody('');
          toast.success('Reply posted.');
        },
        onError: () => toast.error('Could not post reply. Try again.'),
      },
    );
  };

  return (
    <Card className="p-4">
      <HStack className="gap-3 items-center">
        <Avatar src={r.guest_avatar} name={r.guest_name} size={36} />
        <VStack className="flex-1">
          <HStack className="gap-2 items-center">
            <Text className="font-semibold">{r.guest_name}</Text>
            <Text variant="small" className="text-ink-soft">
              · ★ {r.rating}/5
            </Text>
          </HStack>
          <Text variant="small" className="text-ink-soft" numberOfLines={1}>
            {r.listing_title}
          </Text>
        </VStack>
        <Text variant="caption" className="text-ink-soft">
          {r.created_at}
        </Text>
      </HStack>
      <Divider className="my-3" />
      <Text className="text-ink-soft">{r.body}</Text>

      {r.reply ? (
        <View className="mt-3 rounded-2xl bg-surface-alt px-3 py-2.5">
          <Text variant="small" className="font-semibold">Your reply</Text>
          <Text variant="small" className="text-ink-soft mt-0.5">{r.reply.body}</Text>
          <Text variant="caption" className="text-ink-muted mt-1">{r.reply.created_at}</Text>
        </View>
      ) : composing ? (
        <View className="mt-3">
          <Input
            label="Public reply"
            value={body}
            onChangeText={setBody}
            placeholder="Thank the guest, address their points — this is public and one-time."
            multiline
            numberOfLines={3}
            className="min-h-[64px]"
            style={{ textAlignVertical: 'top' }}
          />
          <HStack className="mt-2 justify-end gap-2">
            <Button
              variant="ghost"
              onPress={() => {
                setComposing(false);
                setBody('');
              }}
              disabled={reply.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={submit}
              disabled={!body.trim() || reply.isPending}
              loading={reply.isPending}
            >
              Post reply
            </Button>
          </HStack>
        </View>
      ) : (
        <View className="mt-3 flex-row">
          <Button variant="secondary" onPress={() => setComposing(true)}>
            Reply
          </Button>
        </View>
      )}
    </Card>
  );
}

function TrendChart({
  points,
}: {
  points: Array<{ month: string; avg: number; count: number }>;
}) {
  if (points.length === 0) return null;
  const max = 5;
  const min = 3;
  return (
    <View className="mt-3 flex-row items-end gap-2 h-32">
      {points.map((p) => {
        const ratio = (p.avg - min) / (max - min);
        const height = Math.max(0.05, Math.min(1, ratio)) * 100;
        return (
          <View key={p.month} className="flex-1 items-center gap-1">
            <View className="flex-1 w-full justify-end">
              <View
                className="w-full rounded-t-md bg-brand-500"
                style={{ height: `${height}%` }}
              />
            </View>
            <Text variant="caption" className="text-ink-soft">
              {p.month.slice(5)}
            </Text>
            <Text variant="caption" className="font-semibold">
              {p.avg.toFixed(1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
