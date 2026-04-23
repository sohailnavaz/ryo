import { View } from 'react-native';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { Search, SlidersHorizontal } from './icons';

export type SearchBarProps = {
  label?: string;
  subLabel?: string;
  onPress?: () => void;
  onOpenFilters?: () => void;
  className?: string;
};

export function SearchBar({
  label = 'Anywhere',
  subLabel = 'Any week · Add guests',
  onPress,
  onOpenFilters,
  className,
}: SearchBarProps) {
  return (
    <View className={`flex-row items-center gap-3 ${className ?? ''}`}>
      <Pressable
        onPress={onPress}
        className="flex-1 flex-row items-center gap-3 rounded-full border border-surface-border bg-surface px-4 py-3 shadow-card"
      >
        <Search size={16} color="#222" />
        <View className="flex-1">
          <Text className="font-semibold" numberOfLines={1}>
            {label}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {subLabel}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onOpenFilters}
        className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-surface"
      >
        <SlidersHorizontal size={16} color="#222" />
      </Pressable>
    </View>
  );
}
