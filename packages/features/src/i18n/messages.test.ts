import { describe, expect, it } from 'vitest';
import { translate } from './messages';
import { LOCALES, isLocale, resolveLocale } from './locales';

describe('translate', () => {
  it('returns the source string for English', () => {
    expect(translate('en', 'search.where')).toBe('Where');
  });

  it('translates into other locales (different from English)', () => {
    expect(translate('es', 'search.where')).not.toBe('');
    expect(translate('es', 'search.where')).not.toBe(translate('en', 'search.where'));
  });

  it('interpolates {vars}', () => {
    expect(translate('en', 'home.guestsCount', { count: 3 })).toBe('3 guests');
  });

  it('falls back to the key for an unknown key', () => {
    // @ts-expect-error — intentionally testing an out-of-catalogue key
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
  });

  it('every locale defines the brand tagline', () => {
    for (const l of LOCALES) {
      expect(translate(l.code, 'brand.tagline')).toBe('Just Ryo it.');
    }
  });
});

describe('locale helpers', () => {
  it('detects supported locales', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('xx')).toBe(false);
  });

  it('resolves a browser tag to the nearest supported locale', () => {
    expect(resolveLocale('es-ES')).toBe('es');
    expect(resolveLocale('zh-Hant')).toBe('zh');
    expect(resolveLocale('pt-BR')).toBe('en'); // unsupported → default
    expect(resolveLocale(null)).toBe('en');
  });

  it('marks Arabic as right-to-left', () => {
    expect(LOCALES.find((l) => l.code === 'ar')?.dir).toBe('rtl');
  });
});
