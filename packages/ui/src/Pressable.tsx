import { Pressable as RNPressable, type PressableProps as RNPressableProps } from 'react-native';
import { cn } from '@bnb/utils';

export type PressableProps = RNPressableProps & { className?: string };

export function Pressable({ className, ...props }: PressableProps) {
  return (
    <RNPressable
      className={cn('transition duration-150 active:opacity-80 active:scale-[0.98]', className)}
      {...props}
    />
  );
}
