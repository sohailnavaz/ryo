import type { Metadata } from 'next';
import { FAQ_CATEGORIES } from '@bnb/features/faq-data';
import { JsonLd } from '../../_components/StructuredData';
import View from './view';

export const metadata: Metadata = {
  title: 'Help center & FAQ',
  description:
    'Answers about booking, payments, your stay, cancellations, trust & safety, and hosting on Ryo.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Help center & FAQ',
    description:
      'Answers about booking, payments, your stay, cancellations, trust & safety, and hosting on Ryo.',
  },
};

// FAQPage structured data → eligible for FAQ rich results. Built from the same
// catalogue the screen renders, so the markup never drifts from the UI.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
};

export default function Page() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <View />
    </>
  );
}
