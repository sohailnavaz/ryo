import { useState } from 'react';
import { View } from 'react-native';
import { useAdminFlags, useAdminToggleFlag, type AdminFlag } from '@bnb/api';
import {
  Badge,
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

const FLAG_REASONS = [
  { code: 'launch_window', label: 'Launch window' },
  { code: 'incident_mitigation', label: 'Incident mitigation' },
  { code: 'experiment', label: 'Experiment' },
  { code: 'rollback', label: 'Rollback' },
  { code: 'other', label: 'Other' },
];

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
  const [open, setOpen] = useState(false);
  const toggle = useAdminToggleFlag();
  const next = !flag.enabled;

  return (
    <Card className={`p-5 ${isEmergency ? 'border-2 border-brand-500' : ''}`}>
      <ReasonCodeModal
        open={open}
        onClose={() => setOpen(false)}
        title={`${next ? 'Enable' : 'Disable'} ${flag.key}?`}
        message={
          isEmergency
            ? '🚨 Emergency flag. In production this requires two-person superadmin approval. The change is logged immediately.'
            : flag.description
        }
        reasonCodes={FLAG_REASONS}
        requireNote={isEmergency}
        confirmLabel={next ? 'Enable' : 'Disable'}
        destructive={isEmergency && next}
        loading={toggle.isPending}
        onSubmit={({ reason_code, note }) =>
          toggle.mutate(
            { key: flag.key, enabled: next, reason_code, note: note || undefined },
            {
              onSuccess: () => {
                setOpen(false);
                toast.success(`Flag ${flag.key} ${next ? 'enabled' : 'disabled'}.`);
              },
              onError: () => toast.error('Could not change flag. Try again.'),
            },
          )
        }
      />
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
          accessibilityRole="switch"
          accessibilityState={{ checked: flag.enabled }}
          onPress={() => setOpen(true)}
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
