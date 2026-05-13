import { View } from 'react-native';
import { useAdminFlags, type AdminFlag } from '@bnb/api';
import {
  Badge,
  Card,
  HStack,
  Pressable,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { AdminShell } from './shell';

export function AdminFlagsScreen() {
  const { data, isLoading } = useAdminFlags();

  return (
    <AdminShell
      title="Feature flags"
      subtitle="Toggle features by user, region, or percentage. Every change is logged."
    >
      <View className="mt-6">
        {isLoading || !data ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <VStack className="gap-3">
            {data.map((f) => (
              <FlagRow key={f.key} flag={f} />
            ))}
          </VStack>
        )}
      </View>
    </AdminShell>
  );
}

function FlagRow({ flag }: { flag: AdminFlag }) {
  const isEmergency = flag.key.includes('freeze');
  return (
    <Card className={`p-5 ${isEmergency ? 'border-2 border-brand-500' : ''}`}>
      <HStack className="justify-between gap-3 flex-wrap">
        <VStack className="flex-1 min-w-[260px] gap-1">
          <HStack className="gap-2 items-center flex-wrap">
            <Text className="font-semibold">{flag.key}</Text>
            {isEmergency ? <Badge variant="brand">emergency</Badge> : null}
            <Badge variant="neutral">{flag.rollout_pct}% rollout</Badge>
          </HStack>
          <Text variant="small" className="text-ink-soft">{flag.description}</Text>
          <Text variant="caption" className="text-ink-soft">
            Last changed by {flag.updated_by} · {flag.updated_at}
          </Text>
        </VStack>
        <Pressable
          onPress={() =>
            toast.info(
              isEmergency
                ? 'Preview only — emergency flags require two-person superadmin approval.'
                : `Preview only — would ${flag.enabled ? 'disable' : 'enable'} flag with reason code.`,
            )
          }
          className={`self-start rounded-full px-4 py-2 ${
            flag.enabled ? 'bg-ink' : 'bg-surface-alt'
          }`}
        >
          <Text
            variant="small"
            className={flag.enabled ? 'text-white font-semibold' : 'text-ink font-semibold'}
          >
            {flag.enabled ? 'enabled' : 'disabled'}
          </Text>
        </Pressable>
      </HStack>
    </Card>
  );
}
