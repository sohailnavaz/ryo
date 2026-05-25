import { useState } from 'react';
import { View } from 'react-native';
import {
  requestPasswordReset,
  signInAsRole,
  signInWithPassword,
  signUpWithPassword,
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
  Lock,
  Mail,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

export type SignInScreenProps = { redirectTo?: string };

export function SignInScreen({ redirectTo }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = useSignInWithEmail();
  const signInGoogle = useSignInWithGoogle();
  const router = useRouter();
  const supabaseConfigured = tryGetSupabase() !== null;

  const withPassword = async (mode: 'in' | 'up') => {
    if (!email.includes('@') || password.length < 6) {
      setError('Enter an email and a password of at least 6 characters.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (mode === 'in') await signInWithPassword(email, password);
      else await signUpWithPassword(email, password);
      router.replace(redirectTo ?? '/account');
    } catch (e) {
      const raw = e instanceof Error ? e.message.toLowerCase() : '';
      let msg = e instanceof Error ? e.message : 'Something went wrong. Try again.';
      if (raw.includes('already registered') || raw.includes('already exists')) {
        msg = 'That email already has an account. Use “Sign in”, or “Email me a magic link” if you signed up that way (no password set).';
      } else if (raw.includes('invalid login') || raw.includes('invalid credentials')) {
        msg = 'Wrong email or password. If you first signed in with a magic link, that account has no password — use “Email me a magic link”.';
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

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

  const [resetSent, setResetSent] = useState(false);
  const forgotPassword = async () => {
    if (!email.includes('@')) {
      setError('Enter your email first, then tap “Forgot password”.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const redirect = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
      await requestPasswordReset(email, redirect);
      setResetSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  };

  const enterAs = (role: 'guest' | 'host' | 'admin') => {
    signInAsRole(role);
    const dest = role === 'host' ? '/host' : role === 'admin' ? '/admin' : (redirectTo ?? '/account');
    router.replace(dest);
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
              leftIcon={<Mail size={16} color="#5C5750" />}
              editable={supabaseConfigured}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={16} color="#5C5750" />}
              editable={supabaseConfigured}
            />
            <View className="flex-row gap-2">
              <Button
                title="Sign in"
                onPress={() => withPassword('in')}
                loading={busy}
                disabled={!supabaseConfigured || busy}
                className="flex-1"
              />
              <Button
                title="Create account"
                variant="outline"
                onPress={() => withPassword('up')}
                disabled={!supabaseConfigured || busy}
                className="flex-1"
              />
            </View>

            {resetSent ? (
              <Text variant="small" className="text-center text-success">
                Check your inbox — we sent a link to set a new password.
              </Text>
            ) : (
              <Button
                title="Forgot password?"
                variant="ghost"
                size="sm"
                onPress={forgotPassword}
                disabled={!supabaseConfigured || busy}
              />
            )}

            <Divider className="my-1" />

            <Button
              title={signIn.isPending ? 'Sending…' : 'Email me a magic link'}
              variant="ghost"
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

            <Divider className="my-2" />
            <Text variant="small" className="text-ink-soft text-center">
              Or explore instantly with a demo account (no email needed):
            </Text>
            <Button title="Explore as Guest" variant="outline" onPress={() => enterAs('guest')} fullWidth />
            <Button title="Explore as Host" variant="outline" onPress={() => enterAs('host')} fullWidth />
            <Button title="Explore as Admin" variant="outline" onPress={() => enterAs('admin')} fullWidth />
            <Text variant="caption" className="text-ink-soft text-center">
              Demo only — no real account; stored locally, clears on sign-out.
            </Text>

            <Button title="Back" variant="ghost" onPress={() => router.back()} />
          </VStack>
        )}
      </Card>
    </View>
  );
}
