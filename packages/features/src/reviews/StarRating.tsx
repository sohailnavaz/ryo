import { View } from 'react-native';
import { Pressable, Star, Text } from '@bnb/ui';

export type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  /** Read-only display (no press handlers). */
  readonly?: boolean;
};

/**
 * 1–5 star rating control built from @bnb/ui primitives. Interactive when an
 * `onChange` is supplied; otherwise renders as a static rating row.
 */
export function StarRating({ value, onChange, size = 28, readonly }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View className="flex-row items-center gap-1.5" accessibilityRole="adjustable">
      {stars.map((n) => {
        const filled = n <= value;
        const star = (
          <Star
            size={size}
            color={filled ? '#C87156' : '#C9C2B8'}
            fill={filled ? '#C87156' : 'transparent'}
          />
        );
        if (readonly || !onChange) return <View key={n}>{star}</View>;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
          >
            {star}
          </Pressable>
        );
      })}
      {value > 0 ? (
        <Text variant="small" className="text-ink-soft ml-2">
          {value} / 5
        </Text>
      ) : null}
    </View>
  );
}
