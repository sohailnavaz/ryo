// Server-rendered JSON-LD (schema.org). Organization + WebSite with a
// SearchAction so search engines can surface a sitelinks search box.
// No 'use client' — this renders on the server into the initial HTML.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ryo-web.vercel.app';

/**
 * Serialize JSON-LD for injection into a <script> tag. Plain JSON.stringify does
 * NOT escape `<`, so a value containing `</script>` (e.g. a user-controlled
 * route param) could break out of the script element and inject markup. Escape
 * `<`, `>`, `&`. (The content type is application/ld+json — parsed as JSON, not
 * executed as JS — so escaping `<` is what neutralizes the `</script>` breakout.)
 */
function safeJsonLd(data: unknown): string {
  const map: Record<string, string> = {
    '<': '\\u003c',
    '>': '\\u003e',
    '&': '\\u0026',
  };
  return JSON.stringify(data).replace(/[<>&]/g, (c) => map[c] ?? c);
}

export function StructuredData() {
  const json = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Ryo',
        url: SITE_URL,
        slogan: 'Just Ryo it.',
        description:
          'A universal short-term-stays platform — vetted hosts, a 24/7 concierge, and honest pricing.',
        logo: `${SITE_URL}/icon.svg`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Ryo',
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/?destination={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJsonLd(json) }}
    />
  );
}

/** Reusable JSON-LD emitter for per-page structured data (e.g. a listing, FAQ). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
