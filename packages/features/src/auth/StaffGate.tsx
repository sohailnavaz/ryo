import { useEffect } from 'react';
import { View } from 'react-native';
import { useRole, useSession } from '@bnb/api';
import { Heading, Text, VStack } from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

export type StaffGateProps = {
  children: React.ReactNode;
  /** Where to send a signed-in but non-staff user. */
  fallbackPath?: string;
  /** Where to send a signed-out user. */
  signInPath?: string;
};

/** Gate for the admin/maintenance console. Only `staff`/`admin` roles pass.
 *  Signed-out users go to sign-in; signed-in non-staff users are bounced to
 *  `fallbackPath` and shown a restricted notice during the redirect. */
export function StaffGate({
  children,
  fallbackPath = '/',
  signInPath = '/sign-in',
}: StaffGateProps) {
  const { user, loading: sessionLoading } = useSession();
  const { role, loading: roleLoading } = useRole();
  const router = useRouter();

  const loading = sessionLoading || roleLoading;
  const allowed = role === 'staff' || role === 'admin';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(signInPath);
      return;
    }
    if (!allowed) router.replace(fallbackPath);
  }, [loading, user, allowed, router, signInPath, fallbackPath]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-ink-soft">Loading…</Text>
      </View>
    );
  }

  if (allowed) return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center bg-surface p-6">
      <VStack className="max-w-[420px] items-center gap-2">
        <Heading level={3}>Staff only</Heading>
        <Text className="text-ink-soft text-center">
          This is the Ryo operations console. Your account doesn’t have access — taking you back.
        </Text>
      </VStack>
    </View>
  );
}
