import { Image, View } from 'react-native';
import { cn } from '@bnb/utils';
import { Text } from './Text';

export type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className={cn('bg-surface-alt', className)}
      />
    );
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={cn('bg-brand-100 items-center justify-center', className)}
    >
      <Text className="font-semibold text-brand-700" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}
