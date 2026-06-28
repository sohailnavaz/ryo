import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security & Trust · Ryo',
  description:
    'How Ryo protects your account and data, keeps the marketplace safe, and works with security researchers who report vulnerabilities in good faith.',
  alternates: { canonical: '/legal/security' },
};

export default function SecurityTrustPage() {
  return (
    <article>
      <h1 className="font-display text-3xl text-ink">Security &amp; Trust</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: June 28, 2026</p>

      <p className="mt-6 text-ink-soft leading-relaxed mb-4">
        Being hosted well means being safe. Security and trust aren’t features we bolt on —
        they’re built into how Ryo is designed, operated, and supported. Here’s how we protect
        you, and how to reach us if you ever spot something.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">How we protect you</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We apply layered technical and organizational safeguards across the platform:
      </p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>
          <strong>Encryption in transit</strong> — all traffic is protected with TLS, with
          HSTS enforced so connections stay encrypted.
        </li>
        <li>
          <strong>Encryption at rest</strong> — data stored in our systems is encrypted at
          rest.
        </li>
        <li>
          <strong>Row-Level Security</strong> — our database enforces Supabase Row-Level
          Security policies, so each request can only reach the data it’s authorized to see.
        </li>
        <li>
          <strong>Least-privilege access</strong> — internal access is limited to what’s
          needed, granted by role, and reviewed regularly.
        </li>
        <li>
          <strong>Secure authentication</strong> — passwords are hashed, sessions are managed
          securely, and we support modern sign-in protections.
        </li>
        <li>
          <strong>PCI-compliant payments</strong> — card data is handled by PCI-compliant
          payment processors; Ryo does not store full card numbers.
        </li>
        <li>
          <strong>Monitoring &amp; logging</strong> — we monitor for anomalies and maintain
          audit logs to detect and respond to issues quickly.
        </li>
        <li>
          <strong>Secure development</strong> — we follow a secure software development
          lifecycle, including code review and dependency management.
        </li>
      </ul>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">Trust &amp; safety</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        A trustworthy marketplace takes more than good code. We invest in the human side of
        safety, too:
      </p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>
          <strong>Host vetting &amp; verification</strong> — Hosts and listings go through
          verification before and during their time on the platform.
        </li>
        <li>
          <strong>Secure messaging</strong> — Guests and Hosts communicate through Ryo so
          conversations stay protected and on the record.
        </li>
        <li>
          <strong>24/7 concierge &amp; incident response</strong> — round-the-clock support
          to help with anything from a lost key to a serious issue during a stay.
        </li>
        <li>
          <strong>Guarantees</strong> — protections that stand behind your booking when a stay
          doesn’t go as promised.
        </li>
        <li>
          <strong>Anti-fraud</strong> — risk checks and monitoring to detect and prevent
          fraudulent activity.
        </li>
        <li>
          <strong>Content moderation</strong> — review and enforcement to keep listings,
          reviews, and messages honest and respectful.
        </li>
      </ul>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">Report a vulnerability</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We welcome reports from the security community. If you believe you’ve found a
        vulnerability, please email{' '}
        <a href="mailto:security@ryo.app" className="text-teal-500 underline">
          security@ryo.app
        </a>{' '}
        with enough detail for us to reproduce and investigate. Our machine-readable contact
        information is published at{' '}
        <a href="/.well-known/security.txt" className="text-teal-500 underline">
          /.well-known/security.txt
        </a>{' '}
        per RFC 9116.
      </p>
      <p className="text-ink-soft leading-relaxed mb-4">
        <strong>Safe harbor.</strong> We will not pursue or support legal action against
        researchers who, in good faith, discover and report vulnerabilities in accordance with
        this policy. Please avoid privacy violations, data destruction, and service
        disruption; only interact with accounts you own or have explicit permission to test;
        and give us reasonable time to remediate before any public disclosure. Acting in good
        faith under these guidelines, we consider your research authorized.
      </p>

      <p className="mt-10 text-sm text-ink-muted leading-relaxed">
        For how we handle your data, see our{' '}
        <Link href="/legal/privacy" className="text-teal-500 underline">
          Privacy Policy
        </Link>
        . For the rules of using Ryo, see our{' '}
        <Link href="/legal/terms" className="text-teal-500 underline">
          Terms of Service
        </Link>
        .
      </p>
    </article>
  );
}
