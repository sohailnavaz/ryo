'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES, useLocale, useT } from '@bnb/features';

/**
 * Language picker. `variant="inline"` renders a compact button (for the footer);
 * the menu lists every supported locale with its endonym + flag.
 */
export function LanguageSwitcher({
  variant = 'inline',
  direction = 'up',
}: {
  variant?: 'inline' | 'block';
  direction?: 'up' | 'down';
}) {
  const { locale, meta, setLocale } = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border border-surface-border px-3 py-2 text-[13px] font-semibold text-ink hover:border-ink ${
          variant === 'block' ? 'w-full justify-between' : ''
        }`}
      >
        <span aria-hidden>🌐</span>
        <span>
          {meta.flag} {meta.nativeName}
        </span>
        <span aria-hidden className="text-ink-muted">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t('language.choose')}
          className={`absolute left-0 z-50 w-56 overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-pop ${
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <p className="border-b border-surface-border px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            {t('language.title')}
          </p>
          <div className="py-1">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={l.code === locale}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-surface-alt ${
                  l.code === locale ? 'font-semibold text-ink' : 'text-ink-soft'
                }`}
              >
                <span aria-hidden className="text-[16px]">
                  {l.flag}
                </span>
                <span className="flex-1">{l.nativeName}</span>
                <span className="text-[12px] text-ink-muted">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
