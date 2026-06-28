import type { Metadata } from 'next';
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

export default function Page() {
  return <View />;
}
