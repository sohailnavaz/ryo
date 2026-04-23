import { View, type ViewProps } from 'react-native';
import { cn } from '@bnb/utils';

type StackProps = ViewProps & { className?: string };

export function HStack({ className, ...props }: StackProps) {
  return <View className={cn('flex-row items-center', className)} {...props} />;
}

export function VStack({ className, ...props }: StackProps) {
  return <View className={cn('flex-col', className)} {...props} />;
}
