'use client';

import { useState } from 'react';
import { View } from 'react-native';
import {
  newIdempotencyKey,
  previewAdminAction,
  useFeatureFlags,
  useReasonCodes,
  useRunAdminAction,
  type FeatureFlag,
} from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  HStack,
  ReasonCodeModal,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { formatPrice } from '@bnb/utils';
import { AdminShell } from './shell';

// Feature flags, for real. (docs/15-admin-console.md, Phase 2)
//
// Previously a toggle wrote to a localStorage override — the flag flipped on the
// operator's own screen and nowhere else. For a *kill switch* that is worse than
// having none at all, because it looks like it worked.
//
// Now it goes through `admin_action('flag.toggle')`: reason code, audit row, event,
// and for emergency flags a MANDATORY written note — enforced in the database, not
// merely in this component.

export function AdminFlagsScreen() {
  const { data: flags, isLoading } = useFeatureFlags();
  const { data: reasons } = useReasonCodes('flag');
  const runAction = useRunAdminAction();

  const [pending, setPending] = useState<{ flag: FeatureFlag; radius: string } | null>(null);

  async function askThen(flag: FeatureFlag) {
    try {
      const p = await previewAdminAction({
        action: 'flag.toggle',
        subjectType: 'flag',
        subjectId: flag.key,
        payload: { enabled: !flag.enabled },
      });
      const b = p.blast_radius;

      // An emergency switch is the largest-blast-radius action in the console: it
      // doesn't change one record, it changes the product for everyone. Say so.
      setPending({
        flag,
        radius: b?.emergency
          ? `⚠ Platform-wide kill switch. ${b.upcoming_bookings} upcoming booking(s) worth ${formatPrice(
              b.upcoming_booking_value_cents,
              'INR',
            )} are in flight right now. A written note is required.`
          : `Platform-wide. Turns this ${flag.enabled ? 'off' : 'on'} for every user immediately.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not preview that toggle.');
    }
  }

  async function commit(reason_code: string, note: string) {
    if (!pending) return;
    const { flag } = pending;
    try {
      await runAction.mutateAsync({
        action: 'flag.toggle',
        subjectType: 'flag',
        subjectId: flag.key,
        reasonCode: reason_code,
        note,
        payload: { enabled: !flag.enabled },
        idempotencyKey: newIdempotencyKey(),
      });
      toast.success(`${flag.label} is now ${flag.enabled ? 'off' : 'on'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That toggle did not complete.');
    } finally {
      setPending(null);
    }
  }

  const emergency = (flags ?? []).filter((f) => f.is_emergency);
  const normal = (flags ?? []).filter((f) => !f.is_emergency);

  return (
    <AdminShell
      title="Feature flags"
      subtitle="Every toggle is platform-wide, reasoned, and written to the audit log."
    >
      {isLoading ? (
        <Skeleton className="mt-6 h-80 w-full" />
      ) : (
        <>
          <View className="mt-6">
            <Text variant="label" className="mb-2">
              Features
            </Text>
            <Card className="p-0 overflow-hidden">
              {normal.map((f, i) => (
                <FlagRow key={f.key} flag={f} last={i === normal.length - 1} onToggle={() => askThen(f)} />
              ))}
            </Card>
          </View>

          <View className="mt-6">
            <Text variant="label" className="mb-2">
              Emergency kill switches
            </Text>
            <Card className="p-0 overflow-hidden border-brand-500">
              {emergency.map((f, i) => (
                <FlagRow key={f.key} flag={f} last={i === emergency.length - 1} onToggle={() => askThen(f)} />
              ))}
            </Card>
          </View>
        </>
      )}

      <ReasonCodeModal
        open={pending !== null}
        onClose={() => setPending(null)}
        onSubmit={({ reason_code, note }) => commit(reason_code, note)}
        title={pending ? `${pending.flag.enabled ? 'Turn off' : 'Turn on'} “${pending.flag.label}”?` : ''}
        message={pending?.radius}
        reasonCodes={(reasons ?? []).map((r) => ({ code: r.code, label: r.label }))}
        // The database enforces this too — the UI just says so first.
        requireNote={pending?.flag.is_emergency}
        notePlaceholder="What is happening, and why now?"
        confirmLabel={pending?.flag.enabled ? 'Turn off' : 'Turn on'}
        destructive={pending?.flag.is_emergency}
        loading={runAction.isPending}
      />
    </AdminShell>
  );
}

function FlagRow({
  flag,
  last,
  onToggle,
}: {
  flag: FeatureFlag;
  last: boolean;
  onToggle: () => void;
}) {
  return (
    <View
      className={`px-5 py-4 flex-row items-center justify-between gap-4 ${
        last ? '' : 'border-b border-surface-border'
      }`}
    >
      <VStack className="flex-1 gap-0.5">
        <HStack className="gap-2 items-center flex-wrap">
          <Text className="font-semibold">{flag.label}</Text>
          <Badge variant={flag.enabled ? 'dark' : 'neutral'}>{flag.enabled ? 'on' : 'off'}</Badge>
          {flag.is_emergency ? <Badge variant="brand">emergency</Badge> : null}
        </HStack>
        <Text variant="small" className="text-ink-soft">
          {flag.description}
        </Text>
        <Text variant="small" className="text-ink-soft">
          {flag.key} · updated {new Date(flag.updated_at).toLocaleDateString()}
        </Text>
      </VStack>

      <Button variant="outline" size="sm" onPress={onToggle}>
        {flag.enabled ? 'Turn off…' : 'Turn on…'}
      </Button>
    </View>
  );
}
