import { describe, expect, it } from 'vitest';
import { formatPrice } from './currency';

describe('formatPrice', () => {
  it('formats USD cents into a whole-dollar string by default', () => {
    const out = formatPrice(123400);
    expect(out).toContain('1,234');
    expect(out).toContain('$');
  });

  it('honours a different currency + locale', () => {
    const eur = formatPrice(50000, 'EUR', 'de-DE');
    expect(eur).toContain('500');
    expect(eur).toContain('€');
  });

  it('rounds to whole units (no fraction digits)', () => {
    expect(formatPrice(12399)).not.toMatch(/\.\d/);
  });
});
