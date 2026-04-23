import { ScrollView, View } from 'react-native';
import { type Category, CATEGORIES } from '@bnb/db';
import { cn } from '@bnb/utils';
import { Pressable } from './Pressable';
import { Text } from './Text';
import {
  Anchor,
  Building,
  Compass,
  Flower,
  Home,
  Leaf,
  Mountain,
  Palmtree,
  Sparkles,
  Tent,
  Trees,
} from './icons';

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  compass: Compass,
  palmtree: Palmtree,
  tent: Tent,
  home: Home,
  mountain: Mountain,
  anchor: Anchor,
  flower: Flower,
  sparkles: Sparkles,
  leaf: Leaf,
  building: Building,
  trees: Trees,
};

export type CategoryBarProps = {
  value: Category;
  onChange: (c: Category) => void;
  className?: string;
};

export function CategoryBar({ value, onChange, className }: CategoryBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('border-b border-surface-border', className)}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 28, paddingVertical: 12 }}
    >
      {CATEGORIES.map((c) => {
        const Icon = ICONS[c.icon] ?? Compass;
        const active = value === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            className={cn(
              'items-center gap-1 pb-2',
              active && 'border-b-2 border-ink',
            )}
          >
            <View className={cn('opacity-60', active && 'opacity-100')}>
              <Icon size={22} color="#222" />
            </View>
            <Text
              variant="caption"
              className={cn('text-ink-soft', active && 'text-ink font-semibold')}
            >
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
