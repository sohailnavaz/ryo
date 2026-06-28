import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy · Ryo',
  description:
    'How Ryo collects, uses, shares, and protects your personal data across our travel marketplace — including your GDPR and CCPA/CPRA rights.',
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <article>
      <h1 className="font-display text-3xl text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: June 28, 2026</p>

      <p className="mt-6 text-ink-soft leading-relaxed mb-4">
        This Privacy Policy explains how Ryo (“Ryo,” “we,” “us,” or “our”) collects, uses,
        shares, and protects personal data when you use our websites, mobile apps, and
        related services (together, the “Services”). Ryo is a global marketplace for
        short-term stays that connects travelers (“Guests”) with people who list and host
        accommodations (“Hosts”). We’ve written this policy in plain language because being
        hosted well begins with being treated honestly.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">1. Who we are &amp; scope</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Ryo is the controller of the personal data described here. This policy applies to
        everyone who uses the Services — Guests, Hosts, and visitors — wherever you are in
        the world. Where a Host processes your data for their own purposes (for example,
        their own guest records), that Host is an independent controller and their own
        practices apply alongside ours.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">2. Data we collect</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We collect the data needed to run a safe, useful marketplace. Depending on how you
        use the Services, this can include:
      </p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>
          <strong>Account data</strong> — name, email address, phone number, password
          credentials, and authentication details when you create or sign in to an account.
        </li>
        <li>
          <strong>Profile data</strong> — profile photo, bio, languages, preferences, saved
          places, and verification status you choose to add.
        </li>
        <li>
          <strong>Booking &amp; stay data</strong> — listings you view or save, reservation
          dates, party size, stay details, and your history as a Guest or Host.
        </li>
        <li>
          <strong>Payment data</strong> — billing details and transaction records.
          Card numbers and sensitive payment credentials are collected and processed by our
          PCI-compliant payment processors; Ryo does not store full card numbers.
        </li>
        <li>
          <strong>Messages &amp; support</strong> — communications between Guests and Hosts,
          and your conversations with our concierge and support teams.
        </li>
        <li>
          <strong>Device &amp; usage data</strong> — IP address, device and browser type,
          app version, pages and screens viewed, and diagnostic logs.
        </li>
        <li>
          <strong>Location data</strong> — approximate location from your IP address, and
          precise location only where you grant your device’s location permission (for
          example, to find stays nearby).
        </li>
        <li>
          <strong>Cookies &amp; similar technologies</strong> — as described in our{' '}
          <Link href="/legal/cookies" className="text-teal-500 underline">
            Cookie Policy
          </Link>
          .
        </li>
      </ul>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">3. How we use your data</h2>
      <p className="text-ink-soft leading-relaxed mb-4">We use personal data to:</p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>provide, operate, and maintain the Services and your account;</li>
        <li>process bookings, payments, payouts, refunds, and related taxes;</li>
        <li>
          keep the marketplace safe — verify identity, prevent fraud, enforce our policies,
          and investigate incidents;
        </li>
        <li>
          power our 24/7 concierge and customer support, including responding to your
          requests;
        </li>
        <li>
          personalize your experience — relevant search results, recommendations, and
          content;
        </li>
        <li>communicate with you about your trips, account, and service updates;</li>
        <li>
          improve and develop the Services through analytics and product research; and
        </li>
        <li>comply with legal obligations and enforce our agreements.</li>
      </ul>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">4. Legal bases (EEA/UK)</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        If you are in the European Economic Area or the United Kingdom, we rely on the
        following legal bases under Article 6 of the GDPR:
      </p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>
          <strong>Performance of a contract</strong> — to provide the Services you request,
          including processing bookings and payments.
        </li>
        <li>
          <strong>Legitimate interests</strong> — to secure the platform, prevent fraud,
          improve our products, and provide support, balanced against your rights.
        </li>
        <li>
          <strong>Consent</strong> — for precise location, certain cookies, and optional
          marketing. You may withdraw consent at any time.
        </li>
        <li>
          <strong>Legal obligation</strong> — to meet tax, accounting, safety, and other
          legal requirements.
        </li>
      </ul>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">5. How we share data</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We share personal data only as needed to operate the Services:
      </p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>
          <strong>Between Guests and Hosts</strong> — to make a booking work, we share the
          details each party needs (for example, a Guest’s name and trip details with the
          Host, and the listing and check-in details with the Guest).
        </li>
        <li>
          <strong>Payment processors</strong> — to securely process payments and payouts.
        </li>
        <li>
          <strong>Service providers</strong> — vendors that host our infrastructure, send
          communications, provide analytics, or assist with support, under contracts that
          limit their use of your data.
        </li>
        <li>
          <strong>Legal &amp; safety</strong> — authorities or other parties where required
          by law, or to protect the rights, property, and safety of our users and the
          public.
        </li>
        <li>
          <strong>Business transfers</strong> — in connection with a merger, financing, or
          similar transaction, subject to this policy.
        </li>
      </ul>
      <p className="text-ink-soft leading-relaxed mb-4">
        <strong>We do not sell your personal data.</strong> We also do not “share” it for
        cross-context behavioral advertising as those terms are defined under California law.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        6. International transfers
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Ryo operates globally, so your data may be processed in countries other than your
        own. When we transfer personal data out of the EEA, UK, or Switzerland, we use
        appropriate safeguards such as the European Commission’s Standard Contractual Clauses
        (SCCs) and the UK International Data Transfer Addendum, along with additional
        measures where needed.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">7. Data retention</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We keep personal data only as long as necessary for the purposes described here —
        for example, for the life of your account, to complete and document your bookings,
        to comply with tax and legal obligations, and to resolve disputes. When data is no
        longer needed, we delete or anonymize it.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">8. Your rights</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Depending on where you live, you may have some or all of the following rights:
      </p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>access the personal data we hold about you;</li>
        <li>rectify inaccurate or incomplete data;</li>
        <li>erase your data (the “right to be forgotten”);</li>
        <li>port your data to another service;</li>
        <li>object to certain processing;</li>
        <li>restrict processing in some circumstances;</li>
        <li>withdraw consent where we rely on it; and</li>
        <li>lodge a complaint with a supervisory authority.</li>
      </ul>
      <p className="text-ink-soft leading-relaxed mb-4">
        To exercise any of these rights, email{' '}
        <a href="mailto:privacy@ryo.app" className="text-teal-500 underline">
          privacy@ryo.app
        </a>
        . We will respond within the timeframes required by law and may need to verify your
        identity first. We won’t discriminate against you for exercising your rights.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        9. EEA/UK residents (GDPR)
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        If you are in the EEA or UK, the rights in Section 8 apply to you under the GDPR and
        UK GDPR. You may contact our Data Protection Officer at{' '}
        <a href="mailto:dpo@ryo.app" className="text-teal-500 underline">
          dpo@ryo.app
        </a>{' '}
        with any questions about how we handle your data, and you have the right to complain
        to your local data protection authority.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        10. California residents (CCPA/CPRA)
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        If you are a California resident, the California Consumer Privacy Act, as amended by
        the CPRA, gives you the right to know what personal information we collect, use, and
        disclose; to request access to and deletion of that information; to correct
        inaccurate information; and to limit the use of sensitive personal information. You
        also have the right not to receive discriminatory treatment for exercising these
        rights.
      </p>
      <p className="text-ink-soft leading-relaxed mb-4">
        <strong>Do Not Sell or Share My Personal Information.</strong> Ryo does not sell your
        personal information and does not share it for cross-context behavioral advertising.
        Because we don’t engage in these practices, there is nothing to opt out of — but if
        that ever changes, we will provide a clear “Do Not Sell or Share” control and honor
        opt-out preference signals such as Global Privacy Control (GPC). You may submit
        requests through{' '}
        <a href="mailto:privacy@ryo.app" className="text-teal-500 underline">
          privacy@ryo.app
        </a>
        , and you may use an authorized agent to act on your behalf.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">11. Children’s privacy</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        The Services are intended for adults. You must be at least 18 years old to create an
        account or make a booking. We do not knowingly collect personal data from anyone
        under 18. If you believe a minor has provided us with personal data, contact{' '}
        <a href="mailto:privacy@ryo.app" className="text-teal-500 underline">
          privacy@ryo.app
        </a>{' '}
        and we will delete it.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">12. How we protect data</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We use technical and organizational safeguards — including encryption in transit and
        at rest, row-level access controls, and least-privilege access — to protect your
        data. No system is perfectly secure, but we work hard to keep yours safe. Learn more
        on our{' '}
        <Link href="/legal/security" className="text-teal-500 underline">
          Security &amp; Trust
        </Link>{' '}
        page.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">13. Cookies</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We use cookies and similar technologies to keep you signed in, remember your
        preferences, and understand how the Services are used. For details and your choices,
        see our{' '}
        <Link href="/legal/cookies" className="text-teal-500 underline">
          Cookie Policy
        </Link>
        .
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        14. Changes to this policy
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We may update this Privacy Policy from time to time. When we make material changes,
        we’ll update the “Last updated” date above and, where appropriate, notify you through
        the Services or by email. Please review it periodically.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">15. Contact us</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        For privacy questions or to exercise your rights, email{' '}
        <a href="mailto:privacy@ryo.app" className="text-teal-500 underline">
          privacy@ryo.app
        </a>
        . For matters involving our Data Protection Officer, email{' '}
        <a href="mailto:dpo@ryo.app" className="text-teal-500 underline">
          dpo@ryo.app
        </a>
        .
      </p>
    </article>
  );
}
