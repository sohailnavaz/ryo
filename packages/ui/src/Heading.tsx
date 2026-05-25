import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@bnb/utils';

type Level = 1 | 2 | 3 | 4;

export type HeadingProps = RNTextProps & {
  level?: Level;
  className?: string;
};

// H1–H2 carry the brand in Fraunces (editorial serif); H3–H4 stay in Inter
// for clean UI hierarchy. Per docs/branding.md §7.3.
const levelClass: Record<Level, string> = {
  1: 'font-display tracking-tightest text-[30px] leading-[1.08] font-semibold text-ink md:text-[44px]',
  2: 'font-display tracking-tight text-[23px] leading-[1.15] font-semibold text-ink md:text-[30px]',
  3: 'text-[18px] leading-[24px] font-semibold text-ink',
  4: 'text-[16px] leading-[22px] font-semibold text-ink',
};

export function Heading({ level = 2, className, ...props }: HeadingProps) {
  return <RNText className={cn(levelClass[level], className)} {...props} />;
}
