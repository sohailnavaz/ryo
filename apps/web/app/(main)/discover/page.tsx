import type { Metadata } from 'next';
import View from './view';

export const metadata: Metadata = {
  title: 'Discover stays & destinations',
  description:
    'Get inspired — browse curated destinations, collections, and standout stays from around the world.',
  alternates: { canonical: '/discover' },
  openGraph: {
    title: 'Discover stays & destinations',
    description:
      'Get inspired — browse curated destinations, collections, and standout stays from around the world.',
  },
};

export default function Page() {
  return <View />;
}
