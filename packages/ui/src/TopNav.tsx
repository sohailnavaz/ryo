import { View } from 'react-native';
import { cn } from '@bnb/utils';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { Globe, Menu, User } from './icons';

export type TopNavProps = {
  active: string;
  onChange: (key: string) => void;
  onOpenAccount?: () => void;
  className?: string;
};

type TopNavTab = { key: string; label: string; disabled?: boolean };

const WEB_TABS: TopNavTab[] = [
  { key: 'explore', label: 'Stays' },
  { key: 'experiences', label: 'Experiences', disabled: true },
  { key: 'online', label: 'Online Experiences', disabled: true },
];

export function TopNav({ active, onChange, onOpenAccount, className }: TopNavProps) {
  return (
    <View
      className={cn(
        'hidden md:flex md:flex-row md:items-center md:justify-between md:px-10 md:py-4 md:border-b md:border-surface-border md:bg-surface',
        className,
      )}
    >
      <Pressable onPress={() => onChange('explore')} className="flex-row items-center gap-1">
        <Text className="text-[22px] font-bold text-brand-500">bnb</Text>
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
        <Pressable className="rounded-full p-2.5 active:bg-surface-alt">
          <Globe size={16} color="#222" />
        </Pressable>
        <Pressable
          onPress={onOpenAccount}
          className="flex-row items-center gap-2 rounded-full border border-surface-border px-3 py-1.5 active:bg-surface-alt"
        >
          <Menu size={14} color="#222" />
          <View className="h-7 w-7 items-center justify-center rounded-full bg-ink">
            <User size={14} color="#fff" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
