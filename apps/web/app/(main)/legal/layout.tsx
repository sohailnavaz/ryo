import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/security', label: 'Security & Trust' },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-8">
          <Link
            href="/legal"
            className="text-xs font-semibold uppercase tracking-widest text-brand-500"
          >
            Legal
          </Link>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-b border-surface-border pb-5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
