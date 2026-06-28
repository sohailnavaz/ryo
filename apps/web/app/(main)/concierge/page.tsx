import type { Metadata } from 'next';
import View from './view';

export const metadata: Metadata = {
  title: '24/7 Concierge',
  description:
    'Your multilingual travel concierge — ask anything before, during, or after your stay, any time of day.',
  alternates: { canonical: '/concierge' },
  openGraph: {
    title: '24/7 Concierge',
    description:
      'Your multilingual travel concierge — ask anything before, during, or after your stay, any time of day.',
  },
};

export default function Page() {
  return <View />;
}
