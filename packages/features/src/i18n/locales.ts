// Supported UI locales for Ryo. "Scaffold + switcher + key languages" — the
// system is extensible (add a code here + a dictionary in ./messages), and the
// app falls back to English for any missing key so partial translations are safe.

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ja';

export type LocaleMeta = {
  code: Locale;
  /** English name. */
  name: string;
  /** Endonym (name in the language itself). */
  nativeName: string;
  flag: string;
  /** Text direction — Arabic is right-to-left. */
  dir: 'ltr' | 'rtl';
  /** BCP-47 tag for Intl formatting (currency, dates). */
  bcp47: string;
};

export const LOCALES: LocaleMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr', bcp47: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr', bcp47: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr', bcp47: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr', bcp47: 'de-DE' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl', bcp47: 'ar' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr', bcp47: 'zh-CN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr', bcp47: 'ja-JP' },
];

export const DEFAULT_LOCALE: Locale = 'en';

const BY_CODE = new Map(LOCALES.map((l) => [l.code, l]));

export function localeMeta(code: Locale): LocaleMeta {
  return BY_CODE.get(code) ?? BY_CODE.get(DEFAULT_LOCALE)!;
}

export function isLocale(value: string): value is Locale {
  return BY_CODE.has(value as Locale);
}

/** Best-effort map of a browser/device language tag (e.g. "pt-BR", "zh-Hant") to
 *  a supported locale, falling back to English. */
export function resolveLocale(tag: string | null | undefined): Locale {
  if (!tag) return DEFAULT_LOCALE;
  const base = tag.toLowerCase().split('-')[0] ?? '';
  return isLocale(base) ? (base as Locale) : DEFAULT_LOCALE;
}
