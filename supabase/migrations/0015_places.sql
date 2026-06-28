-- 0015_places.sql — Worldwide places (geo gazetteer) for destination search.
--
-- Backs the live, exhaustive destination typeahead. The app ships a curated
-- in-bundle fallback (packages/api/src/places-data.ts) so search always works;
-- this table is the authoritative, exhaustive tier when Supabase is wired.
--
-- Seed it from GeoNames (https://download.geonames.org/export/dump/) via
-- scripts/import-places.mjs — e.g. cities15000 (~26k) up to cities500 (~200k)
-- or allCountries (millions). The schema + index below handle either size.
--
-- Read is public (anon) — destinations are not sensitive. There are no writes
-- from the app; the table is import-managed (service role / SQL only).

create extension if not exists pg_trgm;

create table if not exists public.places (
  id            bigint primary key,            -- GeoNames geonameid (stable)
  name          text not null,                 -- preferred display name
  ascii_name    text not null,                 -- ascii form, for accent-insensitive match
  country       text not null,                 -- display country name
  country_code  text not null,                 -- ISO 3166-1 alpha-2, uppercase
  admin1        text,                          -- state / province / region (optional)
  population    bigint not null default 0,
  lat           double precision,
  lng           double precision,
  feature_kind  text not null default 'city'   -- 'city' | 'country'
);

-- Trigram indexes power fast fuzzy / prefix / substring matching on both the
-- accented and ascii names.
create index if not exists places_name_trgm    on public.places using gin (name gin_trgm_ops);
create index if not exists places_ascii_trgm   on public.places using gin (ascii_name gin_trgm_ops);
create index if not exists places_population    on public.places (population desc);
create index if not exists places_country_code  on public.places (country_code);

alter table public.places enable row level security;

-- Public, read-only.
drop policy if exists "places public read" on public.places;
create policy "places public read"
  on public.places for select
  using (true);

-- Lightweight ascii/lower normalizer used by the search needle. Avoids a hard
-- dependency on the `unaccent` extension being present; collapses to lower() if
-- unaccent isn't installed.
create or replace function public.unaccent_lower(t text)
returns text
language plpgsql
immutable
as $$
begin
  begin
    return lower(unaccent(t));
  exception when undefined_function then
    return lower(t);
  end;
end;
$$;

-- search_places(q, lim) — ranked destination search.
--   * Prefix matches rank highest, then trigram similarity, then population.
--   * Accent-insensitive via the ascii_name column.
--   * SECURITY INVOKER + stable; safe to expose to anon.
create or replace function public.search_places(q text, lim int default 8)
returns table (
  name text,
  country text,
  country_code text,
  admin1 text,
  kind text,
  population bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with needle as (select lower(unaccent_lower(q)) as n)
  select p.name, p.country, p.country_code, p.admin1,
         p.feature_kind as kind, p.population
  from public.places p, needle
  where p.ascii_name ilike needle.n || '%'
     or p.name ilike needle.n || '%'
     or p.ascii_name % needle.n
  order by
    -- exact prefix on the start of the name wins
    (case when lower(p.ascii_name) like needle.n || '%' then 0 else 1 end),
    similarity(p.ascii_name, needle.n) desc,
    p.population desc
  limit greatest(1, least(lim, 25));
$$;

grant execute on function public.search_places(text, int) to anon, authenticated;
