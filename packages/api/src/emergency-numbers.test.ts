import { describe, expect, it } from 'vitest';
import { lookupEmergencyNumbers } from './emergency-numbers';

describe('lookupEmergencyNumbers', () => {
  it('resolves by ISO code', () => {
    expect(lookupEmergencyNumbers('JP')?.police).toBe('110');
  });

  it('resolves by country name, case-insensitively', () => {
    expect(lookupEmergencyNumbers('france')?.general).toBe('112');
    expect(lookupEmergencyNumbers('United Kingdom')?.general).toBe('999');
  });

  it('returns undefined for unknown input', () => {
    expect(lookupEmergencyNumbers('Atlantis')).toBeUndefined();
    expect(lookupEmergencyNumbers('')).toBeUndefined();
    expect(lookupEmergencyNumbers(null)).toBeUndefined();
  });
});
