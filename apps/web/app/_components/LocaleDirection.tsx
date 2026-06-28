'use client';

import { useEffect } from 'react';
import { localeMeta, useLocaleStore } from '@bnb/features';

/**
 * Reflects the active UI locale onto <html>: sets `lang` (a11y + SEO) and `dir`
 * (so Arabic renders right-to-left). Client-only; renders nothing.
 */
export function LocaleDirection() {
  const locale = useLocaleStore((s) => s.locale);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const meta = localeMeta(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
  }, [locale]);
  return null;
}
