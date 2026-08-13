'use client';

import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';
const KEY = 'ryo.theme';

function resolve(mode: Mode): 'light' | 'dark' {
  if (mode === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

function apply(mode: Mode) {
  document.documentElement.setAttribute('data-theme', resolve(mode));
}

/** Light / Dark / System theme switcher. Persists to localStorage and flips the
 *  `data-theme` attribute the CSS keys off. Follows the OS when set to System. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Mode | null) ?? 'system';
    setMode(stored);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (((localStorage.getItem(KEY) as Mode | null) ?? 'system') === 'system') apply('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const choose = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
    apply(m);
  };

  const opts: Array<{ m: Mode; label: string; icon: string }> = [
    { m: 'light', label: 'Light', icon: '☀️' },
    { m: 'dark', label: 'Dark', icon: '🌙' },
    { m: 'system', label: 'Auto', icon: '💻' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full border border-surface-border bg-surface p-0.5">
      {opts.map((o) => (
        <button
          key={o.m}
          type="button"
          onClick={() => choose(o.m)}
          aria-pressed={mode === o.m}
          title={`${o.label} theme`}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${
            mode === o.m ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <span aria-hidden>{o.icon}</span>
          {compact ? null : <span>{o.label}</span>}
        </button>
      ))}
    </div>
  );
}
