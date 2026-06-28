import type { Metadata } from 'next';
import { JsonLd } from '../../../_components/StructuredData';
import View from './view';

/** Derive a human-readable title from a listing slug id. */
function humanize(id: string): string {
  return id
    .replace(/^l-/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const humanTitle = humanize(id);
  const description = `Book ${humanTitle} on Ryo — vetted hosts, a 24/7 concierge, and honest pricing.`;
  return {
    title: humanTitle,
    description,
    alternates: { canonical: `/listing/${id}` },
    openGraph: { title: humanTitle, description, type: 'website' },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const human = humanize(id);
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LodgingBusiness',
        name: human,
        url: `/listing/${id}`,
        description: `Book ${human} on Ryo.`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ryo', item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Stays', item: '/' },
          { '@type': 'ListItem', position: 3, name: human, item: `/listing/${id}` },
        ],
      },
    ],
  };
  return (
    <>
      <JsonLd data={data} />
      <View />
    </>
  );
}
