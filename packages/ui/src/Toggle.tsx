import { View } from 'react-native';
import { cn } from '@bnb/utils';
import { Pressable } from './Pressable';

export type ToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** Minimal brand-styled switch. Track turns ink when on; knob slides. */
export function Toggle({ value, onChange, disabled, accessibilityLabel }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        if (!disabled) onChange(!value);
      }}
      className={cn(disabled && 'opacity-40')}
    >
      <View
        className={cn(
          'h-7 w-12 rounded-full justify-center px-0.5',
          value ? 'bg-ink' : 'bg-surface-border',
        )}
      >
        <View
          className={cn(
            'h-6 w-6 rounded-full bg-white',
            value ? 'self-end' : 'self-start',
          )}
        />
      </View>
    </Pressable>
  );
}
