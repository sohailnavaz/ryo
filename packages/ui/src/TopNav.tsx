import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@bnb/utils';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { Bell, Menu, User } from './icons';

export type TopNavProps = {
  active: string;
  onChange: (key: string) => void;
  onOpenAccount?: () => void;
  onOpenNotifications?: () => void;
  notificationCount?: number;
  /** Show the guest browse tabs (Stays/Stories). Off for host/admin chrome. */
  showTabs?: boolean;
  /** Context label shown in place of tabs (e.g. "Hosting", "Operations"). */
  context?: string;
  /** Functional language control rendered in the nav (the single source of
   *  truth for language — the app no longer duplicates it in the account menu). */
  languageControl?: ReactNode;
  className?: string;
};

type TopNavTab = { key: string; label: string; disabled?: boolean };

const WEB_TABS: TopNavTab[] = [
  { key: 'explore', label: 'Stays' },
  { key: 'stories', label: 'Stories' },
  { key: 'discover', label: 'Map' },
  { key: 'experiences', label: 'Experiences', disabled: true },
];

export function TopNav({
  active,
  onChange,
  onOpenAccount,
  onOpenNotifications,
  notificationCount = 0,
  showTabs = true,
  context,
  languageControl,
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
          {showTabs ? (
            WEB_TABS.map((t) => (
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
            ))
          ) : context ? (
            <Text className="text-[15px] font-semibold text-ink-soft">{context}</Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          {languageControl ?? null}
          <Pressable
            onPress={onOpenNotifications}
            accessibilityRole="button"
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
            accessibilityRole="button"
            accessibilityLabel="Account menu"
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
