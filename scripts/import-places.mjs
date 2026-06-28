#!/usr/bin/env node
// scripts/import-places.mjs — seed the `places` table from GeoNames.
//
// Populates the exhaustive destination-search tier (migration 0015_places.sql).
// The app works without this (it falls back to the curated in-bundle dataset),
// but running it gives you worldwide city coverage.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/import-places.mjs [dataset]
//
//   dataset (optional): one of  cities15000 | cities5000 | cities1000 | cities500
//     default cities15000 (~26k cities). cities500 is ~200k (largest practical).
//
// Requires Node >= 20 (global fetch) and the `@supabase/supabase-js` dep that
// the monorepo already has. Downloads + unzips the GeoNames dump in-memory and
// upserts in batches. Re-runnable (idempotent on geonameid).

import { createClient } from '@supabase/supabase-js';
import { inflateRawSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

const DATASET = process.argv[2] ?? 'cities15000';
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

// ISO country code → display name (GeoNames countryInfo, abbreviated to what we
// need: code → English name). Downloaded alongside the cities dump.
async function loadCountryNames() {
  const res = await fetch('https://download.geonames.org/export/dump/countryInfo.txt');
  const text = await res.text();
  const map = new Map();
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('\t');
    const iso = cols[0];
    const name = cols[4];
    if (iso && name) map.set(iso, name);
  }
  return map;
}

// GeoNames "admin1" codes → names, for state/province display (e.g. "Texas").
async function loadAdmin1() {
  const res = await fetch('https://download.geonames.org/export/dump/admin1CodesASCII.txt');
  const text = await res.text();
  const map = new Map();
  for (const line of text.split('\n')) {
    if (!line) continue;
    const cols = line.split('\t');
    // key is "<country>.<admin1>", e.g. "US.TX"
    if (cols[0] && cols[1]) map.set(cols[0], cols[1]);
  }
  return map;
}

async function downloadCities(dataset) {
  const url = `https://download.geonames.org/export/dump/${dataset}.zip`;
  console.log(`Downloading ${url} …`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GeoNames download failed: ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());
  // GeoNames zips contain a single <dataset>.txt — unzip the central file.
  // unzipSync handles gzip; for the zip container we parse the stored entry.
  // Simpler + dependency-free: use the .txt path via DEFLATE stored entry.
  return extractTxtFromZip(zip, `${dataset}.txt`);
}

// Minimal ZIP reader: finds the named entry, inflates it (DEFLATE) to text.
function extractTxtFromZip(buf, name) {
  // Locate local file header for `name`.
  const sig = 0x04034b50;
  let i = 0;
  while (i < buf.length - 4) {
    if (buf.readUInt32LE(i) === sig) {
      const method = buf.readUInt16LE(i + 8);
      const compSize = buf.readUInt32LE(i + 18);
      const nameLen = buf.readUInt16LE(i + 26);
      const extraLen = buf.readUInt16LE(i + 28);
      const fname = buf.toString('utf8', i + 30, i + 30 + nameLen);
      const dataStart = i + 30 + nameLen + extraLen;
      if (fname === name) {
        const comp = buf.subarray(dataStart, dataStart + compSize);
        const raw = method === 0 ? comp : inflateRaw(comp);
        return raw.toString('utf8');
      }
      i = dataStart + compSize;
    } else {
      i++;
    }
  }
  throw new Error(`Entry ${name} not found in zip`);
}

function inflateRaw(comp) {
  // DEFLATE (raw) — GeoNames zips store entries with method 8 (deflate).
  return Buffer.from(inflateRawSync(comp));
}

async function main() {
  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  console.log('Loading country + admin1 reference …');
  const [countries, admin1] = await Promise.all([loadCountryNames(), loadAdmin1()]);

  const txt = await downloadCities(DATASET);
  const lines = txt.split('\n');
  console.log(`Parsed ${lines.length} GeoNames rows. Building records …`);

  // GeoNames "cities" columns (tab-separated):
  // 0 geonameid 1 name 2 asciiname 3 alternatenames 4 lat 5 lng 6 fclass
  // 7 fcode 8 country 9 cc2 10 admin1 11 admin2 ... 14 population ...
  const rows = [];
  for (const line of lines) {
    if (!line) continue;
    const c = line.split('\t');
    const id = Number(c[0]);
    if (!id) continue;
    const cc = c[8];
    rows.push({
      id,
      name: c[1],
      ascii_name: c[2] || c[1],
      country: countries.get(cc) ?? cc,
      country_code: cc,
      admin1: admin1.get(`${cc}.${c[10]}`) ?? null,
      population: Number(c[14]) || 0,
      lat: Number(c[4]) || null,
      lng: Number(c[5]) || null,
      feature_kind: 'city',
    });
  }

  // Also add one 'country' row per country so bare country searches resolve.
  for (const [cc, name] of countries) {
    rows.push({
      id: -hashCode(cc), // negative, stable, won't collide with geonameid
      name,
      ascii_name: name,
      country: name,
      country_code: cc,
      admin1: null,
      population: 0,
      lat: null,
      lng: null,
      feature_kind: 'country',
    });
  }

  console.log(`Upserting ${rows.length} places in batches …`);
  const BATCH = 1000;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await sb.from('places').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Batch ${i / BATCH} failed:`, error.message);
      process.exit(1);
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log('\nDone.');
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
