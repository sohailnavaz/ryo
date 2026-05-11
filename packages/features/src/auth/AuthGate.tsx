import { useEffect } from 'react';
import { View } from 'react-native';
import { tryGetSupabase, useDemoUser, useSession } from '@bnb/api';
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
  const supabaseConfigured = tryGetSupabase() !== null;
  const demo = useDemoUser();

  // When Supabase is wired, redirect anonymous users to sign-in.
  // When Supabase isn't wired AND no demo user, also redirect (sign-in offers
  // a "Continue as Mira (demo)" button which seeds the demo identity).
  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (!supabaseConfigured && demo) return;
    router.replace(signInPath);
  }, [user, loading, router, signInPath, supabaseConfigured, demo]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-ink-soft">Loading…</Text>
      </View>
    );
  }

  // Authenticated — real or demo — render children.
  if (user) return <>{children}</>;

  // Falling through is a transient state while the useEffect redirects.
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <Text className="text-ink-soft">Redirecting…</Text>
    </View>
  );
}
