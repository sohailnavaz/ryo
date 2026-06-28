import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy · Ryo',
  description:
    'The cookies and similar technologies Ryo uses, why we use them, and how you can manage your preferences.',
  alternates: { canonical: '/legal/cookies' },
};

const ROWS = [
  {
    category: 'Strictly necessary',
    purpose:
      'Keep you signed in, secure your session, and protect against cross-site request forgery (CSRF).',
    examples: 'Session, authentication, and CSRF tokens',
    optional: 'Always on',
  },
  {
    category: 'Functional',
    purpose: 'Remember your choices, such as language, region, and display preferences.',
    examples: 'Locale and preference cookies',
    optional: 'Optional',
  },
  {
    category: 'Analytics',
    purpose:
      'Understand how the Services are used so we can improve performance and design — in aggregate.',
    examples: 'Usage and diagnostics cookies',
    optional: 'Optional',
  },
];

export default function CookiePolicyPage() {
  return (
    <article>
      <h1 className="font-display text-3xl text-ink">Cookie Policy</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: June 28, 2026</p>

      <p className="mt-6 text-ink-soft leading-relaxed mb-4">
        This Cookie Policy explains how Ryo uses cookies and similar technologies, and the
        choices you have. It should be read alongside our{' '}
        <Link href="/legal/privacy" className="text-teal-500 underline">
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">What cookies are</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Cookies are small text files stored on your device when you visit a website or use an
        app. They help services work, remember your preferences, and understand how they’re
        being used. We also use related technologies such as local storage and software
        development kits (SDKs) — we refer to all of these as “cookies” here.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">Cookies we use</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We use only the cookies we need to run a useful, trustworthy marketplace.{' '}
        <strong>We do not use advertising or cross-site tracking cookies.</strong>
      </p>

      <div className="my-6 overflow-hidden rounded-2xl border border-surface-border shadow-card">
        <div className="hidden grid-cols-[1.1fr_2fr_1.6fr_0.9fr] gap-4 bg-surface-alt px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:grid">
          <span>Category</span>
          <span>Purpose</span>
          <span>Examples</span>
          <span>Status</span>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.category}
            className="grid grid-cols-1 gap-1 border-t border-surface-border px-5 py-4 sm:grid-cols-[1.1fr_2fr_1.6fr_0.9fr] sm:gap-4"
          >
            <span className="font-display text-base text-ink">{row.category}</span>
            <span className="text-sm text-ink-soft leading-relaxed">{row.purpose}</span>
            <span className="text-sm text-ink-soft leading-relaxed">{row.examples}</span>
            <span className="text-sm text-ink-soft">{row.optional}</span>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">Third-party cookies</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        A few trusted providers set cookies needed to deliver core features:
      </p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>
          <strong>Supabase</strong> — to manage secure authentication and keep you signed in.
        </li>
        <li>
          <strong>Our payment processor</strong> — to process payments securely and help
          prevent fraud during checkout.
        </li>
      </ul>
      <p className="text-ink-soft leading-relaxed mb-4">
        These providers act on our behalf and are bound by contracts that limit how they use
        your data.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">Managing your cookies</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        You’re in control of optional cookies. You can:
      </p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>
          adjust your choices any time by reopening{' '}
          <strong>Cookie preferences</strong> from our consent banner or footer;
        </li>
        <li>
          use your browser settings to block or delete cookies — note that blocking strictly
          necessary cookies may stop parts of the Services from working; and
        </li>
        <li>
          where supported, send a Global Privacy Control (GPC) signal, which we honor for
          optional cookies.
        </li>
      </ul>
      <p className="text-ink-soft leading-relaxed mb-4">
        Strictly necessary cookies can’t be switched off, because the Services can’t run
        securely without them.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">Changes to this policy</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We may update this Cookie Policy as our practices evolve. When we do, we’ll revise the
        “Last updated” date above and, for material changes, ask for your consent again where
        required.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">Contact us</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Questions about cookies? Email{' '}
        <a href="mailto:privacy@ryo.app" className="text-teal-500 underline">
          privacy@ryo.app
        </a>
        .
      </p>
    </article>
  );
}
