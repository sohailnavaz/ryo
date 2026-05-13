import { View } from 'react-native';
import { DEMO_HOST_ID, useHostInbox } from '@bnb/api';
import {
  Avatar,
  Badge,
  Card,
  HStack,
  Pressable,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { HostShell } from './shell';

export function HostInboxScreen({ hostId = DEMO_HOST_ID }: { hostId?: string }) {
  const { data, isLoading } = useHostInbox(hostId);
  const router = useRouter();

  return (
    <HostShell
      title="Inbox"
      subtitle="One stream across every guest, across every listing."
    >
      <View className="mt-6">
        {isLoading || !data ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length === 0 ? (
          <Card className="p-8 items-center">
            <Text className="text-ink-soft">No threads yet.</Text>
          </Card>
        ) : (
          <VStack className="gap-2">
            {data.map((t) => (
              <Pressable key={t.id} onPress={() => router.push(`/host/inbox/${t.id}`)}>
                <Card className="p-4 flex-row gap-3 items-center">
                  <Avatar src={t.guest_avatar} name={t.guest_name} size={44} />
                  <VStack className="flex-1 gap-0.5">
                    <HStack className="justify-between gap-2">
                      <Text className="font-semibold" numberOfLines={1}>
                        {t.guest_name}
                      </Text>
                      <Text variant="caption" className="text-ink-soft">
                        {t.last_at}
                      </Text>
                    </HStack>
                    <Text variant="small" className="text-ink-soft" numberOfLines={1}>
                      {t.listing_title}
                    </Text>
                    <Text variant="small" className="text-ink" numberOfLines={1}>
                      {t.preview}
                    </Text>
                  </VStack>
                  {t.unread ? (
                    <Badge variant="brand">new</Badge>
                  ) : null}
                </Card>
              </Pressable>
            ))}
          </VStack>
        )}
      </View>
    </HostShell>
  );
}
