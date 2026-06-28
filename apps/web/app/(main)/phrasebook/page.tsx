import type { Metadata } from 'next';
import View from './view';

export const metadata: Metadata = {
  title: 'Travel phrasebook',
  description:
    'Essential travel phrases with simple pronunciation hints — works offline, in multiple languages.',
  alternates: { canonical: '/phrasebook' },
  openGraph: {
    title: 'Travel phrasebook',
    description:
      'Essential travel phrases with simple pronunciation hints — works offline, in multiple languages.',
  },
};

export default function Page() {
  return <View />;
}
