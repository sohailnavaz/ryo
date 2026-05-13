import { useState } from 'react';
import { View } from 'react-native';
import { useAdminAudit } from '@bnb/api';
import {
  Badge,
  Card,
  HStack,
  Input,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { AdminShell } from './shell';

export function AdminAuditScreen() {
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const { data, isLoading } = useAdminAudit({
    actor: actor.trim() || undefined,
    action: action.trim() || undefined,
  });

  return (
    <AdminShell
      title="Audit log"
      subtitle="Every privileged staff action. Append-only. Reviewed weekly by ops lead."
    >
      <View className="mt-6 flex-row gap-3 flex-wrap">
        <View className="flex-1 min-w-[220px]">
          <Input label="Actor" placeholder="e.g. concierge:naomi" value={actor} onChangeText={setActor} />
        </View>
        <View className="flex-1 min-w-[220px]">
          <Input label="Action" placeholder="e.g. refund" value={action} onChangeText={setAction} />
        </View>
      </View>

      <View className="mt-6">
        {isLoading || !data ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length === 0 ? (
          <Card className="p-8 items-center">
            <Text className="text-ink-soft">No audit entries match these filters.</Text>
          </Card>
        ) : (
          <VStack className="gap-2">
            {data.map((e) => (
              <Card key={e.id} className="px-4 py-3">
                <HStack className="gap-3 justify-between flex-wrap">
                  <VStack className="flex-1 min-w-[260px] gap-0.5">
                    <HStack className="gap-2 items-center flex-wrap">
                      <Text className="font-semibold">{e.action.replace(/_/g, ' ')}</Text>
                      <Badge variant="neutral">{e.reason_code}</Badge>
                    </HStack>
                    <Text variant="small" className="text-ink-soft">
                      {e.actor} → {e.target}
                    </Text>
                  </VStack>
                  <Text variant="caption" className="text-ink-soft">{e.created_at}</Text>
                </HStack>
              </Card>
            ))}
          </VStack>
        )}
      </View>
    </AdminShell>
  );
}
