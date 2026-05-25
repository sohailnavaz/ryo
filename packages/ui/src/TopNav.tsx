import { View } from 'react-native';
import { cn } from '@bnb/utils';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { Bell, Globe, Menu, User } from './icons';

export type TopNavProps = {
  active: string;
  onChange: (key: string) => void;
  onOpenAccount?: () => void;
  onOpenNotifications?: () => void;
  notificationCount?: number;
  className?: string;
};

type TopNavTab = { key: string; label: string; disabled?: boolean };

const WEB_TABS: TopNavTab[] = [
  { key: 'explore', label: 'Stays' },
  { key: 'stories', label: 'Stories' },
  { key: 'experiences', label: 'Experiences', disabled: true },
];

export function TopNav({
  active,
  onChange,
  onOpenAccount,
  onOpenNotifications,
  notificationCount = 0,
  className,
}: TopNavProps) {
  return (
    <View
      className={cn(
        'hidden md:flex md:border-b md:border-surface-border md:bg-surface',
        className,
      )}
    >
      {/* Inner row contained to the same centered 1600px column as page content */}
      <View className="w-full max-w-[1600px] mx-auto flex-row items-center justify-between px-10 py-4">
        <Pressable onPress={() => onChange('explore')} className="flex-row items-center gap-1">
          <Text className="font-display text-[26px] font-semibold tracking-tightest text-brand-500">Ryo</Text>
        </Pressable>
        <View className="flex-row items-center gap-6">
          {WEB_TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => !t.disabled && onChange(t.key)}
              disabled={t.disabled}
            >
              <Text
                className={cn(
                  'text-[15px]',
                  active === t.key ? 'font-semibold text-ink' : 'text-ink-soft',
                  t.disabled && 'opacity-50',
                )}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable className="rounded-full p-2.5 hover:bg-surface-alt transition">
            <Globe size={16} color="#0E1A2B" />
          </Pressable>
          <Pressable
            onPress={onOpenNotifications}
            accessibilityLabel="Notifications"
            className="relative rounded-full p-2.5 hover:bg-surface-alt active:scale-95 transition"
          >
            <Bell size={16} color="#0E1A2B" />
            {notificationCount > 0 ? (
              <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
            ) : null}
          </Pressable>
          <Pressable
            onPress={onOpenAccount}
            className="flex-row items-center gap-2 rounded-full border border-surface-border px-3 py-1.5 hover:shadow-soft active:scale-95 transition"
          >
            <Menu size={14} color="#0E1A2B" />
            <View className="h-7 w-7 items-center justify-center rounded-full bg-ink">
              <User size={14} color="#FAF6F0" />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
