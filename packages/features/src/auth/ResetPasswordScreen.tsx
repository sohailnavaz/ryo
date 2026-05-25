import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { tryGetSupabase, updatePassword } from '@bnb/api';
import { Button, Card, Heading, Input, Lock, Text, VStack, toast } from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

/** Set a new password after following a reset email. The recovery link lands
 *  here with a session (detectSessionInUrl / code exchange); the user then sets
 *  a password. Also how magic-link-only accounts set a password the first time. */
export function ResetPasswordScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Establish the recovery session from the email link, then allow setting a pw.
  useEffect(() => {
    const sb = tryGetSupabase();
    if (!sb || typeof window === 'undefined') {
      setReady(true);
      return;
    }
    const code = new URL(window.location.href).searchParams.get('code');
    const run = async () => {
      try {
        if (code) await sb.auth.exchangeCodeForSession(code);
      } catch {
        // ignore — detectSessionInUrl may have already handled it
      } finally {
        setReady(true);
      }
    };
    void run();
  }, []);

  const submit = async () => {
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords don’t match.');
    setError(null);
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      toast.success('Password updated — you’re all set.');
      setTimeout(() => router.replace('/account'), 800);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update the password.';
      setError(
        /session|auth|jwt/i.test(msg)
          ? 'This reset link has expired or was already used. Request a new one from sign-in.'
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-surface items-center justify-center p-4">
      <Card className="w-full max-w-[420px] p-6 gap-4">
        <VStack className="gap-2">
          <Heading level={2}>Set a new password</Heading>
          <Text className="text-ink-soft">
            Choose a password for your account. You’ll use it to sign in next time.
          </Text>
        </VStack>

        {done ? (
          <Text className="text-success font-semibold">Password updated. Taking you in…</Text>
        ) : (
          <VStack className="gap-3">
            <Input
              label="New password"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={16} color="#5C5750" />}
              editable={ready}
            />
            <Input
              label="Confirm password"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              value={confirm}
              onChangeText={setConfirm}
              leftIcon={<Lock size={16} color="#5C5750" />}
              editable={ready}
            />
            <Button
              title={busy ? 'Saving…' : 'Set password'}
              onPress={submit}
              loading={busy}
              disabled={!ready || busy}
              fullWidth
            />
            {error ? (
              <Text variant="small" className="text-[#B4432F]">{error}</Text>
            ) : null}
            <Button title="Back to sign-in" variant="ghost" onPress={() => router.replace('/sign-in')} />
          </VStack>
        )}
      </Card>
    </View>
  );
}
