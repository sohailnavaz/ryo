import { forwardRef } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { cn } from '@bnb/utils';
import { Text } from './Text';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, containerClassName, leftIcon, rightIcon, ...props },
  ref,
) {
  return (
    <View className={cn('gap-1', containerClassName)}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View
        className={cn(
          'flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-3',
          'transition-colors focus-within:border-brand-500',
          error && 'border-danger',
        )}
      >
        {leftIcon}
        <TextInput
          ref={ref}
          placeholderTextColor="#6B6F80"
          className={cn('flex-1 text-[15px] text-ink outline-none', className)}
          {...props}
        />
        {rightIcon}
      </View>
      {error ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
