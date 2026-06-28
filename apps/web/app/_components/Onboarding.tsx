'use client';

import { useEffect, useState } from 'react';
import { useT, type MessageKey } from '@bnb/features';

const STORAGE_KEY = 'ryo.onboarded';

const STEPS: Array<{ icon: string; title: MessageKey; body: MessageKey }> = [
  { icon: '🌿', title: 'onboarding.welcomeTitle', body: 'onboarding.welcomeBody' },
  { icon: '🌍', title: 'onboarding.searchTitle', body: 'onboarding.searchBody' },
  { icon: '🛎️', title: 'onboarding.conciergeTitle', body: 'onboarding.conciergeBody' },
  { icon: '🛡️', title: 'onboarding.trustTitle', body: 'onboarding.trustBody' },
];

export function Onboarding() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!visible) return null;

  const finish = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const last = step === STEPS.length - 1;
  const current = STEPS[step]!;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-pop">
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt text-[32px]">
            {current.icon}
          </div>
          <h2 className="font-display text-[24px] font-semibold text-ink">{t(current.title)}</h2>
          <p className="mt-2 text-[15px] leading-[22px] text-ink-soft">{t(current.body)}</p>

          {/* progress dots */}
          <div className="mt-6 flex justify-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-5 bg-brand-500' : 'w-1.5 bg-warm-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-surface-border px-6 py-4">
          <button
            type="button"
            onClick={finish}
            className="text-[14px] font-semibold text-ink-soft hover:text-ink"
          >
            {t('common.skip')}
          </button>
          <button
            type="button"
            onClick={() => (last ? finish() : setStep((s) => s + 1))}
            className="rounded-full bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-600"
          >
            {last ? t('common.getStarted') : t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
