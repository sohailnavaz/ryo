import { View, type ViewProps } from 'react-native';
import { cn } from '@bnb/utils';

export type CardProps = ViewProps & { className?: string };

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn('rounded-2xl bg-surface border border-surface-border', className)}
      {...props}
    />
  );
}
