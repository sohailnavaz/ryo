import { useState } from 'react';
import { View } from 'react-native';
import { useSignInWithEmail } from '@bnb/api';
import {
  Button,
  Card,
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
  const signIn = useSignInWithEmail();
  const router = useRouter();

  const submit = async () => {
    if (!email.includes('@')) return;
    try {
      await signIn.mutateAsync({ email, redirectTo });
      setSent(true);
    } catch (e) {
      console.warn('sign-in failed', e);
    }
  };

  return (
    <View className="flex-1 bg-surface items-center justify-center p-4">
      <Card className="w-full max-w-[420px] p-6 gap-4">
        <VStack className="gap-2">
          <Heading level={2}>Welcome to bnb</Heading>
          <Text className="text-ink-soft">
            Enter your email and we'll send you a magic link to sign in or create an account.
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
            />
            <Button
              title={signIn.isPending ? 'Sending…' : 'Continue with email'}
              onPress={submit}
              loading={signIn.isPending}
              fullWidth
            />
            <Button title="Back" variant="ghost" onPress={() => router.back()} />
          </VStack>
        )}
      </Card>
    </View>
  );
}
