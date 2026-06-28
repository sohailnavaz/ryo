import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Legal · Ryo',
  description:
    'Ryo’s policies in plain language — Privacy Policy, Terms of Service, Cookie Policy, and Security & Trust.',
  alternates: { canonical: '/legal' },
};

const CARDS = [
  {
    href: '/legal/privacy',
    title: 'Privacy Policy',
    description: 'What we collect, why, and the rights you have over your data.',
  },
  {
    href: '/legal/terms',
    title: 'Terms of Service',
    description: 'The rules of using Ryo as a guest or a host, and how bookings work.',
  },
  {
    href: '/legal/cookies',
    title: 'Cookie Policy',
    description: 'The cookies we use, why we use them, and how to manage them.',
  },
  {
    href: '/legal/security',
    title: 'Security & Trust',
    description: 'How we protect your account, your stay, and your data.',
  },
];

export default function LegalIndexPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Legal & policies</h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        Our policies, in plain language. We believe being hosted well starts with being
        honest — so we’ve written these to be read, not just agreed to.
      </p>
      <p className="mt-2 text-sm text-ink-muted">Last updated: June 28, 2026</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-surface-border bg-surface-alt p-6 shadow-card transition-colors hover:border-brand-500"
          >
            <h2 className="font-display text-xl text-ink group-hover:text-brand-500">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-sm text-ink-muted leading-relaxed">
        Questions about any of these? Reach us at{' '}
        <a href="mailto:legal@ryo.app" className="text-teal-500 underline">
          legal@ryo.app
        </a>
        .
      </p>
    </div>
  );
}
