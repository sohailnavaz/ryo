// Content translation endpoint — translates listing content (titles,
// descriptions, cities) into the requested locale, cached in
// `content_translations` so each string is translated once. Falls back to the
// original text whenever anything is unavailable (no key, API error, bad JSON),
// so the UI never breaks — it just shows the source language.
//
// POST { texts: string[], target: string }  ->  { translations: string[] }
// (same order as input). `target` is a locale code; 'en*' is a no-op.

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'claude-haiku-4-5-20251001'; // fast + cheap; ideal for translation
const MAX_TEXTS = 60;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ar: 'Arabic',
  zh: 'Simplified Chinese',
  ja: 'Japanese',
};

function hash(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 40);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: { texts?: unknown; target?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const texts = Array.isArray(body.texts)
    ? body.texts.filter((t): t is string => typeof t === 'string').slice(0, MAX_TEXTS)
    : [];
  const target = typeof body.target === 'string' ? body.target : '';
  const lang = LANGUAGE_NAMES[target.slice(0, 2)];

  // Nothing to do — source is English, unknown target, or empty input.
  if (texts.length === 0 || !lang || target.slice(0, 2) === 'en') {
    return json({ translations: texts });
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const locale = target.slice(0, 2);
  const hashes = texts.map(hash);

  // 1. Cache lookup.
  const cache = new Map<string, string>();
  if (supaUrl && supaKey) {
    try {
      const supabase = createClient(supaUrl, supaKey);
      const { data } = await supabase
        .from('content_translations')
        .select('text_hash, translated')
        .eq('locale', locale)
        .in('text_hash', hashes);
      for (const row of data ?? []) cache.set(row.text_hash, row.translated);
    } catch {
      /* cache is best-effort */
    }
  }

  const missing = texts
    .map((t, i) => ({ t, i }))
    .filter(({ i }) => !cache.has(hashes[i] as string));

  // 2. Translate cache misses via Claude (if configured).
  const fresh = new Map<number, string>();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (missing.length > 0 && apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system:
          `You are a translation engine for a short-term-stays app. Translate each ` +
          `string in the input JSON array into ${lang}. Keep proper nouns (place and ` +
          `brand names) natural for that language. Return ONLY a JSON array of the ` +
          `translated strings, in the same order, and nothing else.`,
        messages: [{ role: 'user', content: JSON.stringify(missing.map((m) => m.t)) }],
      });
      const raw = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      const arr = start >= 0 && end > start ? JSON.parse(raw.slice(start, end + 1)) : null;
      if (Array.isArray(arr)) {
        const rows: Array<{ text_hash: string; locale: string; translated: string }> = [];
        missing.forEach((m, k) => {
          const tr = arr[k];
          if (typeof tr === 'string' && tr.length > 0) {
            fresh.set(m.i, tr);
            rows.push({ text_hash: hashes[m.i] as string, locale, translated: tr });
          }
        });
        // 3. Persist for next time.
        if (rows.length > 0 && supaUrl && supaKey) {
          try {
            await createClient(supaUrl, supaKey)
              .from('content_translations')
              .upsert(rows, { onConflict: 'text_hash,locale' });
          } catch {
            /* best-effort cache write */
          }
        }
      }
    } catch {
      /* fall through to originals */
    }
  }

  // 4. Assemble: cached → fresh → original fallback.
  const translations = texts.map(
    (t, i) => cache.get(hashes[i] as string) ?? fresh.get(i) ?? t,
  );
  return json({ translations });
}
