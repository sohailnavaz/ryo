import { Pressable } from 'react-native';
import { cn } from '@bnb/utils';

export type IconButtonProps = {
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  testID?: string;
  /** Accessible name for this icon-only control (screen readers + a11y). */
  accessibilityLabel?: string;
};

export function IconButton({
  onPress,
  children,
  className,
  disabled,
  testID,
  accessibilityLabel,
}: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
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
