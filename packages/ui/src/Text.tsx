import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@bnb/utils';

type Variant = 'body' | 'small' | 'caption' | 'label' | 'bold';

export type TextProps = RNTextProps & {
  variant?: Variant;
  className?: string;
};

const variantClass: Record<Variant, string> = {
  body: 'text-[15px] leading-[22px] text-ink',
  small: 'text-[13px] leading-[18px] text-ink',
  caption: 'text-[12px] leading-[16px] text-ink-soft',
  label: 'text-[13px] leading-[18px] font-semibold text-ink',
  bold: 'text-[15px] leading-[22px] font-semibold text-ink',
};

export function Text({ variant = 'body', className, ...props }: TextProps) {
  return <RNText className={cn(variantClass[variant], className)} {...props} />;
}
