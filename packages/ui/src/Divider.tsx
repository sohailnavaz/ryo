import { View } from 'react-native';
import { cn } from '@bnb/utils';

export function Divider({ className }: { className?: string }) {
  return <View className={cn('h-px w-full bg-surface-border my-4', className)} />;
}
