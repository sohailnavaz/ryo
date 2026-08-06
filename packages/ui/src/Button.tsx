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

const base =
  'flex-row items-center justify-center rounded-full transition duration-150 active:scale-[0.97]';

// On the void, "on-accent" surfaces (aqua / white / coral) carry DARK text; surfaces
// on the void carry light text. Getting this wrong is how a dark theme goes invisible.
const variantClass: Record<Variant, string> = {
  primary: 'bg-brand-500 hover:bg-brand-400 active:bg-brand-600 glow-aqua', // aqua, the neon CTA
  secondary: 'bg-ink hover:bg-ink/90 active:bg-ink/80', // ink is now near-white → a light button
  ghost: 'bg-transparent hover:bg-surface-alt active:bg-warm-200',
  outline:
    'bg-transparent border border-surface-border hover:border-brand-500/50 hover:bg-surface-alt active:bg-warm-200',
  danger: 'bg-danger hover:opacity-90 active:opacity-80',
};

const variantText: Record<Variant, string> = {
  primary: 'text-cream', // dark text on aqua
  secondary: 'text-cream', // dark text on the near-white button
  ghost: 'text-ink',
  outline: 'text-ink',
  danger: 'text-cream', // dark text on coral
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
        <ActivityIndicator color={variant === 'ghost' || variant === 'outline' ? '#F3F4F8' : '#0A0A0F'} />
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
