import { useEffect } from 'react';
import { View } from 'react-native';
import { tryGetSupabase, useSession } from '@bnb/api';
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

  useEffect(() => {
    if (!loading && !user && supabaseConfigured) router.replace(signInPath);
  }, [user, loading, router, signInPath, supabaseConfigured]);

  // Dev / preview mode: no Supabase wired. Render children with a banner so
  // the page is at least visible (using fallback data) instead of redirect-looping.
  if (!supabaseConfigured) {
    return (
      <View className="flex-1 bg-surface">
        <View className="bg-surface-alt border-b border-surface-border px-4 py-2 md:px-10">
          <Text variant="small" className="text-ink-soft">
            Preview mode · Supabase not configured. Showing demo content.
          </Text>
        </View>
        {children}
      </View>
    );
  }

  if (loading || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-ink-soft">Loading…</Text>
      </View>
    );
  }
  return <>{children}</>;
}
