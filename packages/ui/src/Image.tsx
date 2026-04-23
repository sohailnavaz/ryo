import { Image as RNImage, type ImageProps as RNImageProps } from 'react-native';
import { cn } from '@bnb/utils';

export type ImageProps = Omit<RNImageProps, 'source'> & {
  uri: string;
  className?: string;
};

export function Image({ uri, className, ...props }: ImageProps) {
  return (
    <RNImage
      source={{ uri }}
      className={cn('bg-surface-alt', className)}
      resizeMode="cover"
      {...props}
    />
  );
}
