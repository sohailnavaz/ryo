import { useEffect } from 'react';
import { View } from 'react-native';
import { useSession } from '@bnb/api';
import { Text } from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

export type AuthGateProps = {
  children: React.ReactNode;
  /** Path to send unauthenticated users to. */
  signInPath?: string;
};

export function AuthGate({ children, signInPath = '/sign-in' }: AuthGateProps) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace(signInPath);
  }, [user, loading, router, signInPath]);

  if (loading || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-ink-soft">Loading…</Text>
      </View>
    );
  }
  return <>{children}</>;
}
