'use client';

import { useEffect, useState } from 'react';
import { useT } from '@bnb/features';

const STORAGE_KEY = 'ryo.cookie-consent';
export const OPEN_COOKIE_PREFS_EVENT = 'ryo:open-cookie-prefs';

type Consent = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  decided: boolean;
};

const DEFAULT: Consent = { necessary: true, functional: true, analytics: false, decided: false };

function read(): Consent {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Consent>), necessary: true };
  } catch {
    return DEFAULT;
  }
}

function write(c: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

/** Programmatically reopen the preferences panel (footer / cookie policy link). */
export function openCookiePreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFS_EVENT));
  }
}

export function CookieConsent() {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    setMounted(true);
    const c = read();
    setFunctional(c.functional);
    setAnalytics(c.analytics);
    if (!c.decided) setVisible(true);
    const reopen = () => {
      const cur = read();
      setFunctional(cur.functional);
      setAnalytics(cur.analytics);
      setCustomizing(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_PREFS_EVENT, reopen);
  }, []);

  if (!mounted || !visible) return null;

  const commit = (c: Consent) => {
    write(c);
    setVisible(false);
    setCustomizing(false);
  };
  const acceptAll = () =>
    commit({ necessary: true, functional: true, analytics: true, decided: true });
  const rejectAll = () =>
    commit({ necessary: true, functional: false, analytics: false, decided: true });
  const savePrefs = () => commit({ necessary: true, functional, analytics, decided: true });

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-surface-border bg-surface p-5 shadow-pop">
        <p className="font-display text-[18px] font-semibold text-ink">{t('cookies.title')}</p>
        <p className="mt-1.5 text-[14px] leading-[21px] text-ink-soft">{t('cookies.body')}</p>

        {customizing ? (
          <div className="mt-4 space-y-3">
            <Toggle checked disabled label={t('cookies.necessary')} desc={t('cookies.necessaryDesc')} />
            <Toggle
              checked={functional}
              onChange={setFunctional}
              label={t('cookies.functional')}
              desc={t('cookies.functionalDesc')}
            />
            <Toggle
              checked={analytics}
              onChange={setAnalytics}
              label={t('cookies.analytics')}
              desc={t('cookies.analyticsDesc')}
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-brand-500 px-4 py-2 text-[14px] font-semibold text-white hover:bg-brand-600"
          >
            {t('cookies.acceptAll')}
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-full border border-surface-border px-4 py-2 text-[14px] font-semibold text-ink hover:border-ink"
          >
            {t('cookies.rejectAll')}
          </button>
          {customizing ? (
            <button
              type="button"
              onClick={savePrefs}
              className="rounded-full border border-ink px-4 py-2 text-[14px] font-semibold text-ink hover:bg-surface-alt"
            >
              {t('cookies.savePrefs')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCustomizing(true)}
              className="rounded-full border border-surface-border px-4 py-2 text-[14px] font-semibold text-ink hover:border-ink"
            >
              {t('cookies.customize')}
            </button>
          )}
          <a
            href="/legal/cookies"
            className="ml-auto text-[13px] font-semibold text-teal-500 underline"
          >
            {t('cookies.learnMore')}
          </a>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  desc,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-surface-border p-3 text-left disabled:opacity-100"
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${
          checked ? 'bg-brand-500' : 'bg-warm-300'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        <span className="block text-[13px] text-ink-soft">{desc}</span>
      </span>
    </button>
  );
}
