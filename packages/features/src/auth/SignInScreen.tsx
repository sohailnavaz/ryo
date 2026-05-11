import { useState } from 'react';
import { View } from 'react-native';
import {
  signInAsDemo,
  tryGetSupabase,
  useSignInWithEmail,
  useSignInWithGoogle,
} from '@bnb/api';
import {
  Button,
  Card,
  Divider,
  Heading,
  Input,
  Mail,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

export type SignInScreenProps = { redirectTo?: string };

export function SignInScreen({ redirectTo }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = useSignInWithEmail();
  const signInGoogle = useSignInWithGoogle();
  const router = useRouter();
  const supabaseConfigured = tryGetSupabase() !== null;

  const submit = async () => {
    if (!email.includes('@')) return;
    setError(null);
    try {
      await signIn.mutateAsync({ email, redirectTo });
      setSent(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
      setError(msg);
    }
  };

  const enterAsDemo = () => {
    signInAsDemo();
    router.replace(redirectTo ?? '/account');
  };

  const continueWithGoogle = async () => {
    setError(null);
    try {
      await signInGoogle.mutateAsync({ redirectTo });
      // Supabase redirects the browser — nothing else to do here.
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed.';
      setError(msg);
    }
  };

  return (
    <View className="flex-1 bg-surface items-center justify-center p-4">
      <Card className="w-full max-w-[420px] p-6 gap-4">
        <VStack className="gap-2">
          <Heading level={2}>Welcome to Ryo</Heading>
          <Text className="text-ink-soft">
            {supabaseConfigured
              ? "Enter your email and we'll send you a magic link to sign in or create an account."
              : 'Magic-link sign-in needs a Supabase project (not wired in this preview). Use the demo account to explore the signed-in flows.'}
          </Text>
        </VStack>

        {sent ? (
          <VStack className="gap-2">
            <Heading level={4}>Check your inbox</Heading>
            <Text className="text-ink-soft">
              We sent a sign-in link to <Text className="font-semibold">{email}</Text>. Click the
              link to continue.
            </Text>
            <Button title="Use a different email" variant="ghost" onPress={() => setSent(false)} />
          </VStack>
        ) : (
          <VStack className="gap-3">
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={16} color="#717171" />}
              editable={supabaseConfigured}
            />
            <Button
              title={signIn.isPending ? 'Sending…' : 'Continue with email'}
              onPress={submit}
              loading={signIn.isPending}
              disabled={!supabaseConfigured}
              fullWidth
            />
            <Button
              title={signInGoogle.isPending ? 'Opening Google…' : 'Continue with Google'}
              variant="outline"
              onPress={continueWithGoogle}
              loading={signInGoogle.isPending}
              disabled={!supabaseConfigured}
              fullWidth
            />
            {error ? (
              <Text variant="small" className="text-[#B4432F]">
                {error}
              </Text>
            ) : null}

            {!supabaseConfigured ? (
              <>
                <Divider className="my-2" />
                <Button
                  title="Continue as Mira (demo)"
                  variant="outline"
                  onPress={enterAsDemo}
                  fullWidth
                />
                <Text variant="small" className="text-ink-soft text-center">
                  No real account is created. Stored locally; clears on sign-out.
                </Text>
              </>
            ) : null}

            <Button title="Back" variant="ghost" onPress={() => router.back()} />
          </VStack>
        )}
      </Card>
    </View>
  );
}
