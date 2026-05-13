import { useState } from 'react';
import { View } from 'react-native';
import { useAdminDashboard } from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  HStack,
  Pressable,
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

export function AdminModerationScreen() {
  const { data, isLoading } = useAdminDashboard();
  const [tab, setTab] = useState<Tab>('listings');

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
          Reviews ({FLAGGED_REVIEWS.length})
        </TabButton>
      </HStack>

      <View className="mt-6">
        {isLoading || !data ? (
          <Skeleton className="h-[400px] w-full" />
        ) : tab === 'listings' ? (
          <ListingsQueue items={data.moderation} />
        ) : (
          <ReviewsQueue items={FLAGGED_REVIEWS} />
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

function ListingsQueue({
  items,
}: {
  items: NonNullable<ReturnType<typeof useAdminDashboard>['data']>['moderation'];
}) {
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
        <Card key={m.id} className="p-5">
          <HStack className="justify-between gap-3">
            <VStack className="flex-1 gap-0.5">
              <Text className="font-semibold" numberOfLines={1}>{m.listing_title}</Text>
              <Text variant="small" className="text-ink-soft">
                {m.listing_city} · submitted {m.submitted_at}
              </Text>
              <Text variant="small" className="mt-1">{m.reason}</Text>
            </VStack>
            <Badge variant={m.state === 'in_review' ? 'brand' : 'dark'}>
              {m.state.replace('_', ' ')}
            </Badge>
          </HStack>
          <HStack className="mt-4 gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onPress={() => toast.success('Preview only — would mark approved with reason code.')}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => toast.info('Preview only — opens reason-code prompt for the host.')}
            >
              Request changes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => toast.warning('Preview only — destructive reject flow with confirm.')}
            >
              Reject
            </Button>
          </HStack>
        </Card>
      ))}
    </VStack>
  );
}

function ReviewsQueue({
  items,
}: {
  items: Array<{
    id: string;
    listing_title: string;
    guest_name: string;
    rating: number;
    body: string;
    reason: string;
  }>;
}) {
  return (
    <VStack className="gap-3">
      {items.map((r) => (
        <Card key={r.id} className="p-5">
          <HStack className="justify-between gap-3">
            <VStack className="flex-1 gap-0.5">
              <Text className="font-semibold">{r.guest_name}</Text>
              <Text variant="small" className="text-ink-soft">
                {r.listing_title} · ★ {r.rating}/5
              </Text>
            </VStack>
            <Badge variant="brand">flagged</Badge>
          </HStack>
          <Text className="mt-3 text-ink-soft">{r.body}</Text>
          <View className="mt-3 rounded-xl bg-surface-alt px-3 py-2">
            <Text variant="small" className="text-ink-soft">
              <Text className="font-semibold">Reporter:</Text> {r.reason}
            </Text>
          </View>
          <HStack className="mt-4 gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onPress={() => toast.success('Preview only — review kept with reason code.')}
            >
              Keep
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => toast.info('Preview only — opens edit modal.')}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => toast.warning('Preview only — removes after reason-code confirm.')}
            >
              Remove
            </Button>
          </HStack>
        </Card>
      ))}
    </VStack>
  );
}
