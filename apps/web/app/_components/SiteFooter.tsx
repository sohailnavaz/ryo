'use client';

import Link from 'next/link';
import { useT } from '@bnb/features';
import { LanguageSwitcher } from './LanguageSwitcher';
import { openCookiePreferences } from './CookieConsent';

export function SiteFooter() {
  const t = useT();
  const year = 2026;

  const Col = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="min-w-[140px]">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      <ul className="space-y-2 text-[14px] text-ink-soft">{children}</ul>
    </div>
  );

  const Item = ({ href, label }: { href: string; label: string }) => (
    <li>
      <Link href={href} className="hover:text-ink hover:underline">
        {label}
      </Link>
    </li>
  );

  return (
    <footer className="mt-16 border-t border-surface-border bg-surface-alt">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-12 md:px-10">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="max-w-[280px]">
            <p className="font-display text-[24px] font-semibold text-ink">{t('footer.company')}</p>
            <p className="mt-2 text-[14px] leading-[21px] text-ink-soft">{t('footer.tagline')}</p>
            <p className="mt-3 text-[13px] font-semibold text-brand-700">{t('brand.tagline')}</p>
          </div>

          <Col title={t('footer.explore')}>
            <Item href="/" label={t('nav.explore')} />
            <Item href="/discover" label={t('nav.discover')} />
            <Item href="/stories" label={t('nav.stories')} />
            <Item href="/phrasebook" label="Phrasebook" />
          </Col>

          <Col title={t('footer.support')}>
            <Item href="/faq" label={t('footer.faq')} />
            <Item href="/help" label={t('footer.help')} />
            <Item href="/concierge" label={t('footer.concierge')} />
          </Col>

          <Col title={t('footer.legal')}>
            <Item href="/legal/privacy" label={t('footer.privacy')} />
            <Item href="/legal/terms" label={t('footer.terms')} />
            <Item href="/legal/cookies" label={t('footer.cookies')} />
            <Item href="/legal/security" label={t('footer.security')} />
            <li>
              <button
                type="button"
                onClick={openCookiePreferences}
                className="hover:text-ink hover:underline"
              >
                {t('cookies.preferences')}
              </button>
            </li>
          </Col>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-surface-border pt-6">
          <p className="text-[13px] text-ink-muted">
            © {year} {t('footer.company')}. {t('footer.rights')} · {t('footer.madeWith')}
          </p>
          <LanguageSwitcher variant="inline" />
        </div>
      </div>
    </footer>
  );
}
