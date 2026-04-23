import { View } from 'react-native';
import { cn } from '@bnb/utils';

export function Skeleton({ className }: { className?: string }) {
  return <View className={cn('rounded-xl bg-surface-alt animate-pulse', className)} />;
}
