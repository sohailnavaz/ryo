-- 0024_content_translations.sql — machine-translation cache for listing content.
--
-- Host-written content (titles, descriptions, cities) is data, not UI strings,
-- so it can't be pre-translated. The /api/translate route translates it on
-- demand via the Anthropic API and caches the result here, keyed by a hash of
-- the source text + target locale, so each string is translated once and then
-- served instantly and for free. The text itself is non-sensitive, so the cache
-- is world-readable; the server route fills it.

create table if not exists public.content_translations (
  text_hash  text not null,
  locale     text not null,
  translated text not null,
  created_at timestamptz not null default now(),
  primary key (text_hash, locale)
);

alter table public.content_translations enable row level security;

-- Translations are public, non-sensitive strings.
create policy "content_translations read"
  on public.content_translations for select
  using (true);

-- The translate route (anon key) writes the cache. Low-risk: worst case is a
-- polluted cache entry, never a data leak.
create policy "content_translations write"
  on public.content_translations for insert
  with check (true);
