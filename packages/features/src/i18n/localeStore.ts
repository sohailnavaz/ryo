import { create } from 'zustand';
import { DEFAULT_LOCALE, isLocale, resolveLocale, type Locale } from './locales';

// Persisted UI-locale store. Cross-platform: persistence is guarded behind a
// `window.localStorage` check so it's a no-op on native (where the initial
// value simply defaults, and a native storage adapter can be added later).

const STORAGE_KEY = 'ryo.locale';

function readInitial(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isLocale(saved)) return saved;
    // First visit: best-effort from the browser language.
    return resolveLocale(window.navigator?.language);
  } catch {
    return DEFAULT_LOCALE;
  }
}

type State = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<State>((set) => ({
  locale: readInitial(),
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, locale);
      } catch {
        /* ignore quota / privacy-mode errors */
      }
    }
    set({ locale });
  },
}));
