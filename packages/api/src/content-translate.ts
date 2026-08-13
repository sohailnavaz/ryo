'use client';

// Translate host-written listing content (title / description / city) into the
// active UI locale via the /api/translate endpoint (AI + cache). Falls back to
// the original text whenever translation is off or unavailable, so callers can
// render the result unconditionally.
//
// Web-only for now: the endpoint is a Next route. On native (no relative fetch)
// and for English, it returns the originals unchanged.

import { useQuery } from '@tanstack/react-query';

function isEnglish(locale: string | undefined): boolean {
  return !locale || locale.slice(0, 2) === 'en';
}

/**
 * Translate `texts` into `locale`, preserving order. Returns the originals until
 * (and unless) translations arrive — never throws, never blocks rendering.
 */
export function useContentTranslation(texts: string[], locale: string | undefined): string[] {
  const canTranslate =
    typeof window !== 'undefined' &&
    !isEnglish(locale) &&
    texts.some((t) => t && t.trim().length > 0);

  const { data } = useQuery({
    queryKey: ['content-translate', locale, texts],
    enabled: canTranslate,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60_000,
    retry: false,
    queryFn: async (): Promise<string[]> => {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ texts, target: locale }),
        });
        if (!res.ok) return texts;
        const body = (await res.json()) as { translations?: unknown };
        return Array.isArray(body.translations) && body.translations.length === texts.length
          ? (body.translations as string[])
          : texts;
      } catch {
        return texts;
      }
    },
  });

  return data ?? texts;
}
