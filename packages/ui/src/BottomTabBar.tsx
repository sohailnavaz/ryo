import { View } from 'react-native';
import { cn } from '@bnb/utils';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { Compass, Heart, Home, User } from './icons';

export type BottomTab = {
  key: string;
  label: string;
  icon: 'compass' | 'heart' | 'trips' | 'profile';
};

export const DEFAULT_TABS: BottomTab[] = [
  { key: 'explore', label: 'Explore', icon: 'compass' },
  { key: 'wishlists', label: 'Wishlists', icon: 'heart' },
  { key: 'trips', label: 'Trips', icon: 'trips' },
  { key: 'profile', label: 'Profile', icon: 'profile' },
];

const ICONS = {
  compass: Compass,
  heart: Heart,
  trips: Home,
  profile: User,
};

export type BottomTabBarProps = {
  tabs?: BottomTab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

export function BottomTabBar({ tabs = DEFAULT_TABS, active, onChange, className }: BottomTabBarProps) {
  return (
    <View
      className={cn(
        'flex-row border-t border-surface-border bg-surface px-2 py-1.5 safe-area-inset-bottom',
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = ICONS[tab.icon];
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className="flex-1 items-center py-2 gap-1"
          >
            <Icon size={22} color={isActive ? '#ff385c' : '#717171'} />
            <Text
              variant="caption"
              className={isActive ? 'text-brand-500 font-semibold' : 'text-ink-soft'}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
