import { ScrollView, View } from 'react-native';
import {
  useNotificationsInbox,
  type Notification,
  type NotificationKind,
} from '@bnb/api';
import {
  Badge,
  Button,
  Calendar,
  Card,
  Heading,
  HStack,
  Mail,
  Pressable,
  Sparkles,
  Star,
  Text,
  VStack,
} from '@bnb/ui';

const KIND_ICON: Record<NotificationKind, typeof Calendar> = {
  booking: Calendar,
  message: Mail,
  review: Star,
  system: Sparkles,
};

const KIND_LABEL: Record<NotificationKind, string> = {
  booking: 'Booking',
  message: 'Message',
  review: 'Review',
  system: 'Ryo',
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Guest notifications inbox. Items are grouped Today / Earlier, unread rows
 * carry a terracotta dot, and a single "Mark all read" clears the badge. Backed
 * by the client-side notifications-store (no backend yet) — see that file.
 */
export function NotificationsScreen() {
  const { items, unread, markRead, markAllRead, clearAll } = useNotificationsInbox();

  const today = items.filter((n) => isToday(n.created_at));
  const earlier = items.filter((n) => !isToday(n.created_at));

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="px-4 md:px-8 py-8 max-w-[760px] mx-auto w-full">
        <HStack className="justify-between items-start gap-3 flex-wrap">
          <VStack className="gap-1">
            <HStack className="gap-2 items-center">
              <Heading level={2}>Notifications</Heading>
              {unread > 0 ? <Badge variant="brand">{unread} new</Badge> : null}
            </HStack>
            <Text className="text-ink-soft">
              Stays, messages, and gentle nudges — all in one place.
            </Text>
          </VStack>
          {items.length > 0 ? (
            <HStack className="gap-2">
              <Button
                variant="ghost"
                size="sm"
                onPress={markAllRead}
                disabled={unread === 0}
              >
                Mark all read
              </Button>
              <Button variant="outline" size="sm" onPress={clearAll}>
                Clear all
              </Button>
            </HStack>
          ) : null}
        </HStack>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <VStack className="mt-8 gap-8">
            {today.length > 0 ? (
              <Group label="Today" notifications={today} onRead={markRead} />
            ) : null}
            {earlier.length > 0 ? (
              <Group label="Earlier" notifications={earlier} onRead={markRead} />
            ) : null}
          </VStack>
        )}
      </View>
    </ScrollView>
  );
}

function Group({
  label,
  notifications,
  onRead,
}: {
  label: string;
  notifications: Notification[];
  onRead: (id: string) => void;
}) {
  return (
    <VStack className="gap-3">
      <Text variant="label" className="text-ink-soft uppercase tracking-wide">
        {label}
      </Text>
      <VStack className="gap-3">
        {notifications.map((n) => (
          <NotificationRow key={n.id} notification={n} onRead={onRead} />
        ))}
      </VStack>
    </VStack>
  );
}

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const Icon = KIND_ICON[n.kind];
  return (
    <Pressable onPress={() => onRead(n.id)} disabled={n.read}>
      <Card className={n.read ? 'p-4' : 'p-4 border-brand-200 bg-warm-50'}>
        <HStack className="gap-3 items-start">
          <View className="h-10 w-10 rounded-full bg-surface-alt items-center justify-center">
            <Icon size={18} color="#1F5A6B" />
          </View>

          <VStack className="flex-1 gap-1">
            <HStack className="justify-between items-start gap-2">
              <Text className={n.read ? 'font-semibold' : 'font-semibold text-ink'}>
                {n.title}
              </Text>
              <HStack className="gap-2 items-center shrink-0">
                <Text variant="caption" className="text-ink-soft">
                  {relativeTime(n.created_at)}
                </Text>
                {!n.read ? (
                  <View className="h-2 w-2 rounded-full bg-brand-500" />
                ) : null}
              </HStack>
            </HStack>

            <Text variant="small" className="text-ink-soft">
              {n.body}
            </Text>

            <Badge className="mt-1" variant="neutral">
              {KIND_LABEL[n.kind]}
            </Badge>
          </VStack>
        </HStack>
      </Card>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <Card className="mt-8 p-10 items-center">
      <View className="h-14 w-14 rounded-full bg-surface-alt items-center justify-center">
        <Sparkles size={24} color="#C87156" />
      </View>
      <Heading level={3} className="mt-4">
        You're all caught up
      </Heading>
      <Text variant="small" className="text-ink-soft text-center mt-1 max-w-[360px]">
        New booking updates, host messages, and review nudges will land here.
      </Text>
    </Card>
  );
}
