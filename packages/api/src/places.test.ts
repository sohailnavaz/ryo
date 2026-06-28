import { describe, expect, it } from 'vitest';
import { popularPlaces, searchPlaces } from './places';

// No Supabase client is initialized in the test env, so searchPlaces must fall
// back to the curated in-bundle dataset (searchPlacesLocal) every time.
describe('searchPlaces (offline fallback)', () => {
  it('resolves an empty array for an empty query', async () => {
    await expect(searchPlaces('')).resolves.toEqual([]);
  });

  it('falls back to the curated dataset when no DB is available', async () => {
    const res = await searchPlaces('paris', 5);
    expect(res.length).toBeGreaterThan(0);
    expect(res.length).toBeLessThanOrEqual(5);
    expect(res.some((p) => p.label.includes('Paris'))).toBe(true);
  });
});

describe('popularPlaces', () => {
  it('returns the requested number of city suggestions', () => {
    const res = popularPlaces(6);
    expect(res).toHaveLength(6);
    expect(res.every((p) => p.kind === 'city')).toBe(true);
  });
});
