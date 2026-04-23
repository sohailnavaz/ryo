import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@bnb/utils';

type Level = 1 | 2 | 3 | 4;

export type HeadingProps = RNTextProps & {
  level?: Level;
  className?: string;
};

const levelClass: Record<Level, string> = {
  1: 'text-[28px] leading-[34px] font-bold text-ink md:text-[36px] md:leading-[42px]',
  2: 'text-[22px] leading-[28px] font-bold text-ink md:text-[26px] md:leading-[32px]',
  3: 'text-[18px] leading-[24px] font-semibold text-ink',
  4: 'text-[16px] leading-[22px] font-semibold text-ink',
};

export function Heading({ level = 2, className, ...props }: HeadingProps) {
  return <RNText className={cn(levelClass[level], className)} {...props} />;
}
