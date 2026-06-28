import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service · Ryo',
  description:
    'The terms that govern your use of Ryo as a Guest or Host — bookings, payments, cancellations, conduct, and your rights and responsibilities.',
  alternates: { canonical: '/legal/terms' },
};

export default function TermsOfServicePage() {
  return (
    <article>
      <h1 className="font-display text-3xl text-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: June 28, 2026</p>

      <p className="mt-6 text-ink-soft leading-relaxed mb-4">
        Welcome to Ryo. These Terms of Service (“Terms”) govern your access to and use of
        Ryo’s websites, mobile apps, and related services (the “Services”). By using the
        Services, you agree to these Terms. Please read them carefully — they include
        important information about bookings, payments, and your rights and responsibilities.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">1. Acceptance &amp; eligibility</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        By creating an account or otherwise using the Services, you confirm that you are at
        least 18 years old, can form a binding contract, and will comply with these Terms and
        all applicable laws. If you use the Services on behalf of an organization, you confirm
        you’re authorized to bind that organization to these Terms.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">2. The role of Ryo</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Ryo is a marketplace that connects Guests with Hosts who list short-term
        accommodations. Ryo provides the platform, tools, and support that make a stay
        possible — but Ryo is not a party to the stay itself. When a Guest books a listing,
        the contract for that stay is formed directly between the Guest and the Host. Hosts
        are responsible for their listings and the stays they provide; Guests are responsible
        for their conduct during a stay.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">3. Your account &amp; security</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        You’re responsible for the information you provide and for keeping your account
        secure. Use a strong, unique password, keep your credentials confidential, and notify
        us promptly if you suspect unauthorized access. You’re responsible for activity that
        occurs under your account. We may require identity or other verification to help keep
        the marketplace safe.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        4. Bookings, pricing, fees &amp; taxes
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        When you book a listing, you agree to pay the total price shown at checkout, including
        the nightly rate, any applicable service fee, cleaning fee, and taxes. We believe in
        honest pricing and aim to show the full price before you confirm. Hosts set their own
        rates and rules; certain taxes may be collected and remitted by Ryo or by the Host
        depending on the jurisdiction.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">5. Payments &amp; payouts</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Payments and payouts are handled through PCI-compliant third-party payment
        processors; Ryo does not store full card numbers. Payment processing is being rolled
        out in stages, and some payment flows may currently operate in a controlled or
        demonstration mode. Where a flow is not yet live for real-money settlement, we’ll make
        that clear before you rely on it. By making a booking, you authorize the applicable
        charges, and Hosts authorize the corresponding payouts in accordance with our payout
        schedule.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        6. Cancellations &amp; refunds
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Each listing is subject to a cancellation policy selected by the Host and shown before
        you book. Refunds are issued according to that policy and any applicable Ryo guarantee.
        In limited circumstances — such as a qualifying emergency or a Host’s failure to honor
        a confirmed booking — additional protections may apply. Please review the cancellation
        policy on a listing before you confirm.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        7. Guest conduct &amp; house rules
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Guests must treat each home and neighborhood with care, follow the Host’s house rules,
        respect occupancy limits, and leave the space as they found it. You are responsible for
        anyone you bring with you. Damage, unauthorized parties, and rule violations may result
        in charges, cancellation, or removal from the platform.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        8. Host obligations &amp; listing accuracy
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Hosts must have the right to list and offer their space, keep listings accurate and
        up to date, honor confirmed bookings, comply with applicable laws (including local
        registration, tax, and safety requirements), and provide a safe, clean, and accurately
        represented stay. Misleading listings and last-minute cancellations harm Guests and the
        platform and may lead to penalties or removal.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">9. Reviews</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Reviews help our community make good decisions. They must be honest, based on a genuine
        experience, and free of harassment, discrimination, irrelevant content, or attempts at
        manipulation. We may remove reviews that violate these standards, but we don’t edit
        reviews to change their substance.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">10. Prohibited activities</h2>
      <p className="text-ink-soft leading-relaxed mb-4">You agree not to:</p>
      <ul className="list-disc pl-5 text-ink-soft space-y-1 mb-4">
        <li>break the law or use the Services for unlawful or harmful purposes;</li>
        <li>misrepresent your identity or circumvent fees or our systems;</li>
        <li>post false, infringing, discriminatory, or abusive content;</li>
        <li>scrape, reverse-engineer, or interfere with the Services or their security;</li>
        <li>use the Services to send spam or distribute malware; or</li>
        <li>harass, endanger, or discriminate against other members of the community.</li>
      </ul>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">11. Intellectual property</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        The Services, including the Ryo name, logo, software, and design, are owned by Ryo and
        protected by intellectual-property laws. We grant you a limited, non-exclusive,
        non-transferable, revocable license to use the Services for their intended purpose. No
        other rights are granted.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">12. Your content</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        You retain ownership of the content you submit — listings, photos, messages, and
        reviews. By submitting content, you grant Ryo a worldwide, non-exclusive, royalty-free
        license to host, store, display, and use that content to operate, promote, and improve
        the Services. You’re responsible for ensuring you have the rights to the content you
        share.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        13. Disclaimers &amp; “as is”
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        The Services are provided “as is” and “as available,” without warranties of any kind,
        whether express or implied, to the fullest extent permitted by law. Ryo does not
        warrant that the Services will be uninterrupted or error-free, or that any listing,
        Host, or Guest will meet your expectations. You use the Services at your own discretion
        and risk.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">14. Limitation of liability</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        To the maximum extent permitted by law, Ryo will not be liable for indirect,
        incidental, special, consequential, or punitive damages, or for lost profits, data, or
        goodwill, arising from your use of the Services. Nothing in these Terms limits
        liability that cannot be limited under applicable law.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">15. Indemnification</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        You agree to indemnify and hold Ryo harmless from claims, losses, and expenses
        (including reasonable legal fees) arising out of your use of the Services, your
        content, your stays or listings, or your violation of these Terms or the rights of
        others.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">
        16. Dispute resolution &amp; governing law
      </h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We’d like to resolve concerns directly. If you have a dispute, please contact us first
        so we can try to resolve it informally. If we can’t, disputes will be resolved through
        binding arbitration on an individual basis, except where prohibited by law and except
        for small-claims matters. These Terms are governed by neutral, generally applicable
        law, without regard to conflict-of-laws principles. Some jurisdictions provide rights
        that can’t be waived; nothing here limits those rights.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">17. Changes to these Terms</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        We may update these Terms from time to time. When we make material changes, we’ll
        update the “Last updated” date above and, where appropriate, notify you. Your continued
        use of the Services after changes take effect means you accept the updated Terms.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">18. Termination</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        You may stop using the Services and close your account at any time. We may suspend or
        terminate access if you violate these Terms, create risk for the community, or where
        required by law. Some provisions — including those on content licenses, disclaimers,
        liability, and dispute resolution — survive termination.
      </p>

      <h2 className="font-display text-xl text-ink mt-10 mb-3">19. Contact us</h2>
      <p className="text-ink-soft leading-relaxed mb-4">
        Questions about these Terms? Email{' '}
        <a href="mailto:legal@ryo.app" className="text-teal-500 underline">
          legal@ryo.app
        </a>
        . You can also review our{' '}
        <Link href="/legal/privacy" className="text-teal-500 underline">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link href="/legal/security" className="text-teal-500 underline">
          Security &amp; Trust
        </Link>{' '}
        pages.
      </p>
    </article>
  );
}
