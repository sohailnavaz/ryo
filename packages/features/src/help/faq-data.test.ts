import { describe, expect, it } from 'vitest';
import { FAQ_CATEGORIES, searchFaq } from './faq-data';

describe('FAQ data', () => {
  it('has multiple categories, each with items', () => {
    expect(FAQ_CATEGORIES.length).toBeGreaterThanOrEqual(6);
    for (const cat of FAQ_CATEGORIES) {
      expect(cat.items.length).toBeGreaterThan(0);
      expect(cat.id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe('searchFaq', () => {
  it('returns [] for an empty query', () => {
    expect(searchFaq('')).toEqual([]);
    expect(searchFaq('   ')).toEqual([]);
  });

  it('finds matches across question + answer text, with their category', () => {
    const hits = searchFaq('refund');
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(typeof hit.category).toBe('string');
      expect(`${hit.q} ${hit.a}`.toLowerCase()).toContain('refund');
    }
  });

  it('is case-insensitive', () => {
    expect(searchFaq('REFUND').length).toBe(searchFaq('refund').length);
  });
});
