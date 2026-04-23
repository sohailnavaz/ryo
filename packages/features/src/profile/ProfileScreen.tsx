import { View } from 'react-native';
import { useSession, useSignOut } from '@bnb/api';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  LogOut,
  Text,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

export function ProfileScreen() {
  const { user, loading } = useSession();
  const signOut = useSignOut();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 bg-surface p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-surface p-6 gap-4 md:mx-auto md:max-w-md">
        <Heading level={2}>Log in or sign up</Heading>
        <Text className="text-ink-soft">
          Create an account or sign in to see your trips, wishlists, and more.
        </Text>
        <Button title="Continue with email" onPress={() => router.push('/sign-in')} />
      </View>
    );
  }

  const name = (user.user_metadata?.full_name as string) ?? user.email ?? 'Guest';

  return (
    <View className="flex-1 bg-surface p-4 md:mx-auto md:max-w-[720px] md:w-full md:px-10 md:pt-8">
      <Heading level={1}>Profile</Heading>
      <Card className="mt-4 p-5">
        <HStack className="gap-4">
          <Avatar name={name} size={64} />
          <VStack>
            <Text className="text-[18px] font-semibold">{name}</Text>
            <Text className="text-ink-soft">{user.email}</Text>
          </VStack>
        </HStack>
      </Card>
      <Divider />
      <VStack className="gap-3">
        <Heading level={3}>Account</Heading>
        <Button
          title="Sign out"
          variant="outline"
          leftIcon={<LogOut size={16} color="#222" />}
          onPress={() => signOut.mutate()}
        />
      </VStack>
    </View>
  );
}
