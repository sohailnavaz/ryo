// Locale → dictionary registry + the low-level translate() resolver.
// English is the source of truth; every other locale is typed against its keys
// and falls back to English per-key, so partial translations never crash.

import type { Locale } from './locales';
import { DEFAULT_LOCALE } from './locales';
import { en, type MessageKey, type Messages } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { de } from './messages/de';
import { ar } from './messages/ar';
import { zh } from './messages/zh';
import { ja } from './messages/ja';

export type { MessageKey, Messages };
export { en };

const MESSAGES: Record<Locale, Messages> = { en, es, fr, de, ar, zh, ja };

/**
 * Resolve a key for a locale. Falls back to English for a missing locale or a
 * missing key, then to the key itself (so nothing ever renders blank).
 * Supports `{name}`-style interpolation via the optional `vars` map.
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const dict = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  let out = dict[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return out;
}
