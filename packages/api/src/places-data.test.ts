import { describe, expect, it } from 'vitest';
import {
  COUNTRY_BY_CODE,
  PLACE_OPTIONS,
  WORLD_CITIES,
  WORLD_COUNTRIES,
  searchPlacesLocal,
} from './places-data';

describe('places-data dataset', () => {
  it('covers all 195 countries, alphabetically sorted', () => {
    expect(WORLD_COUNTRIES).toHaveLength(195);
    const names = WORLD_COUNTRIES.map((c) => c.name);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });

  it('has a substantial, real city list', () => {
    expect(WORLD_CITIES.length).toBeGreaterThan(500);
  });

  it('resolves a country by ISO code', () => {
    expect(COUNTRY_BY_CODE.get('FR')?.name).toBe('France');
    expect(COUNTRY_BY_CODE.get('JP')?.name).toBe('Japan');
  });

  it('every city references a known country code', () => {
    for (const city of WORLD_CITIES) {
      expect(COUNTRY_BY_CODE.has(city.code)).toBe(true);
    }
  });
});

describe('searchPlacesLocal', () => {
  it('returns nothing for an empty query', () => {
    expect(searchPlacesLocal('')).toEqual([]);
    expect(searchPlacesLocal('   ')).toEqual([]);
  });

  it('ranks prefix matches first and is case-insensitive', () => {
    const res = searchPlacesLocal('par', 8);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]!.label.toLowerCase().startsWith('par')).toBe(true);
    expect(res.some((p) => p.label.includes('Paris'))).toBe(true);
  });

  it('respects the limit', () => {
    expect(searchPlacesLocal('a', 3).length).toBeLessThanOrEqual(3);
  });

  it('PLACE_OPTIONS lists cities before countries', () => {
    const firstCountry = PLACE_OPTIONS.findIndex((p) => p.kind === 'country');
    const lastCity = PLACE_OPTIONS.map((p) => p.kind).lastIndexOf('city');
    expect(firstCountry).toBeGreaterThan(lastCity);
  });
});
