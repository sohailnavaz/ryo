import { useCallback } from 'react';
import { useLocaleStore } from './localeStore';
import { localeMeta, type Locale, type LocaleMeta } from './locales';
import { translate, type MessageKey } from './messages';

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

/**
 * The translator hook. `const t = useT();  t('search.where')`.
 * Re-renders the component when the active locale changes.
 */
export function useT(): TFunction {
  const locale = useLocaleStore((s) => s.locale);
  return useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );
}

/** Active locale + its metadata + a setter, for switchers and Intl formatting. */
export function useLocale(): {
  locale: Locale;
  meta: LocaleMeta;
  setLocale: (l: Locale) => void;
} {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  return { locale, meta: localeMeta(locale), setLocale };
}
