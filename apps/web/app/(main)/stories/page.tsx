import type { Metadata } from 'next';
import View from './view';

export const metadata: Metadata = {
  title: 'Travel stories',
  description:
    'Editorial guides and stories from the road — places to stay and reasons to go.',
  alternates: { canonical: '/stories' },
  openGraph: {
    title: 'Travel stories',
    description:
      'Editorial guides and stories from the road — places to stay and reasons to go.',
  },
};

export default function Page() {
  return <View />;
}
