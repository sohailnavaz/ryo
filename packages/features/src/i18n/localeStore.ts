import { create } from 'zustand';
import { DEFAULT_LOCALE, isLocale, resolveLocale, type Locale } from './locales';

// Persisted UI-locale store. Cross-platform: persistence is guarded behind a
// `window.localStorage` check so it's a no-op on native (where the initial
// value simply defaults, and a native storage adapter can be added later).

const STORAGE_KEY = 'ryo.locale';

/** The persisted / browser-preferred locale, or null if none / unavailable. */
function readStored(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isLocale(saved)) return saved;
    // First visit: best-effort from the browser language.
    return resolveLocale(window.navigator?.language);
  } catch {
    return null;
  }
}

type State = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Apply the stored/browser locale. Call AFTER mount (see LocaleDirection) so
   *  the client's first render matches the server's (both DEFAULT_LOCALE) — a
   *  synchronous localStorage read at init caused an SSR hydration mismatch that
   *  could crash react-native-web while regenerating the tree. */
  hydrateFromStorage: () => void;
};

export const useLocaleStore = create<State>((set, get) => ({
  // Start at the default so SSR and the client's first paint agree; the real
  // locale is applied post-mount via hydrateFromStorage().
  locale: DEFAULT_LOCALE,
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
  hydrateFromStorage: () => {
    const stored = readStored();
    if (stored && stored !== get().locale) set({ locale: stored });
  },
}));
