import { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@bnb/ui';
import { router } from 'expo-router';

export default function AuthCallback() {
  useEffect(() => {
    const t = setTimeout(() => router.replace('/'), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <Text className="text-ink-soft">Signing you in…</Text>
    </View>
  );
}
