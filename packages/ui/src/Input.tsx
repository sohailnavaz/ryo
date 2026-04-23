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
          error && 'border-brand-500',
        )}
      >
        {leftIcon}
        <TextInput
          ref={ref}
          placeholderTextColor="#b0b0b0"
          className={cn('flex-1 text-[15px] text-ink outline-none', className)}
          {...props}
        />
        {rightIcon}
      </View>
      {error ? (
        <Text variant="caption" className="text-brand-600">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
