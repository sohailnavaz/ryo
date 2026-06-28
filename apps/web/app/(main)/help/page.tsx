import type { Metadata } from 'next';
import View from './view';

export const metadata: Metadata = {
  title: 'Get help & support',
  description:
    'Raise an issue and track it to resolution. Our team and 24/7 concierge are here to help.',
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'Get help & support',
    description:
      'Raise an issue and track it to resolution. Our team and 24/7 concierge are here to help.',
  },
};

export default function Page() {
  return <View />;
}
