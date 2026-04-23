import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { cn } from '@bnb/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  testID?: string;
};

const base = 'flex-row items-center justify-center rounded-full';

const variantClass: Record<Variant, string> = {
  primary: 'bg-brand-500 active:bg-brand-600',
  secondary: 'bg-ink active:bg-ink/90',
  ghost: 'bg-transparent active:bg-surface-alt',
  outline: 'bg-transparent border border-surface-border active:bg-surface-alt',
  danger: 'bg-brand-600 active:bg-brand-700',
};

const variantText: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  ghost: 'text-ink',
  outline: 'text-ink',
  danger: 'text-white',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
};

const sizeText: Record<Size, string> = {
  sm: 'text-[13px] font-semibold',
  md: 'text-[15px] font-semibold',
  lg: 'text-[16px] font-semibold',
};

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        base,
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' || variant === 'outline' ? '#222' : '#fff'} />
      ) : (
        <>
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          {children ?? (
            <Text className={cn(variantText[variant], sizeText[size])}>{title}</Text>
          )}
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}
