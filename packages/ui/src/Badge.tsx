import { View } from 'react-native';
import { cn } from '@bnb/utils';
import { Text } from './Text';

type Variant = 'neutral' | 'brand' | 'dark';

export type BadgeProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

const variantClass: Record<Variant, string> = {
  neutral: 'bg-surface-alt',
  brand: 'bg-brand-500',
  dark: 'bg-ink',
};

const textClass: Record<Variant, string> = {
  neutral: 'text-ink',
  brand: 'text-white',
  dark: 'text-white',
};

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <View className={cn('self-start rounded-full px-3 py-1', variantClass[variant], className)}>
      <Text className={cn('text-[12px] font-semibold', textClass[variant])}>{children}</Text>
    </View>
  );
}
