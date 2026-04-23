import { Pressable as RNPressable, type PressableProps as RNPressableProps } from 'react-native';
import { cn } from '@bnb/utils';

export type PressableProps = RNPressableProps & { className?: string };

export function Pressable({ className, ...props }: PressableProps) {
  return (
    <RNPressable
      className={cn('active:opacity-70 transition-opacity', className)}
      {...props}
    />
  );
}
