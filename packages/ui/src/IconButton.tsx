import { Pressable } from 'react-native';
import { cn } from '@bnb/utils';

export type IconButtonProps = {
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  testID?: string;
};

export function IconButton({ onPress, children, className, disabled, testID }: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'h-10 w-10 items-center justify-center rounded-full bg-surface/80 transition duration-150 hover:bg-surface-alt active:scale-90',
        disabled && 'opacity-50',
        className,
      )}
    >
      {children}
    </Pressable>
  );
}
