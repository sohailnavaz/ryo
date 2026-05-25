// Static emergency-numbers table for the Offline Stay Pack (docs/11 §5 edge
// case: "SOS from a guest without a data connection"). This ships *in the JS
// bundle* — no network, no Supabase — so it renders even with zero signal.
//
// Numbers are the commonly published civilian emergency lines per country.
// Always treat as guidance, not legal authority; the concierge SOS path
// (when online) remains the primary route. Tourist helplines are included
// where a national one exists.

export type EmergencyNumbers = {
  /** ISO 3166-1 alpha-2, uppercase. */
  code: string;
  country: string;
  /** A single number that reaches all services, where one exists. */
  general?: string;
  police?: string;
  ambulance?: string;
  fire?: string;
  /** National tourist assistance line, where published. */
  tourist?: string;
};

export const EMERGENCY_NUMBERS: EmergencyNumbers[] = [
  {
    code: 'US',
    country: 'United States',
    general: '911',
    police: '911',
    ambulance: '911',
    fire: '911',
  },
  {
    code: 'GB',
    country: 'United Kingdom',
    general: '999',
    police: '999',
    ambulance: '999',
    fire: '999',
    tourist: '101', // non-emergency police
  },
  {
    code: 'FR',
    country: 'France',
    general: '112',
    police: '17',
    ambulance: '15',
    fire: '18',
  },
  {
    code: 'ES',
    country: 'Spain',
    general: '112',
    police: '091',
    ambulance: '061',
    fire: '080',
  },
  {
    code: 'IT',
    country: 'Italy',
    general: '112',
    police: '113',
    ambulance: '118',
    fire: '115',
  },
  {
    code: 'DE',
    country: 'Germany',
    general: '112',
    police: '110',
    ambulance: '112',
    fire: '112',
  },
  {
    code: 'JP',
    country: 'Japan',
    police: '110',
    ambulance: '119',
    fire: '119',
    tourist: '050-3816-2787', // Japan Visitor Hotline (24/7)
  },
  {
    code: 'AU',
    country: 'Australia',
    general: '000',
    police: '000',
    ambulance: '000',
    fire: '000',
  },
  {
    code: 'IN',
    country: 'India',
    general: '112',
    police: '100',
    ambulance: '102',
    fire: '101',
    tourist: '1363', // Incredible India tourist helpline
  },
  {
    code: 'AE',
    country: 'United Arab Emirates',
    police: '999',
    ambulance: '998',
    fire: '997',
    tourist: '800-4438', // Dubai tourist police
  },
  {
    code: 'TH',
    country: 'Thailand',
    general: '191',
    police: '191',
    ambulance: '1669',
    fire: '199',
    tourist: '1155', // Tourist Police
  },
  {
    code: 'SG',
    country: 'Singapore',
    police: '999',
    ambulance: '995',
    fire: '995',
  },
];

const BY_CODE = new Map(EMERGENCY_NUMBERS.map((e) => [e.code, e]));
const BY_NAME = new Map(EMERGENCY_NUMBERS.map((e) => [normalise(e.country), e]));

/** Pan-EU / international fallback. */
export const FALLBACK_GENERAL = '112';

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Resolve an emergency-numbers row from either an ISO code (e.g. "JP") or a
 * country name (e.g. "Japan", "japan"). Returns undefined when unknown — the
 * UI then shows the international 112 fallback.
 */
export function lookupEmergencyNumbers(
  countryOrCode: string | null | undefined,
): EmergencyNumbers | undefined {
  if (!countryOrCode) return undefined;
  const raw = countryOrCode.trim();
  if (raw.length === 2 && BY_CODE.has(raw.toUpperCase())) {
    return BY_CODE.get(raw.toUpperCase());
  }
  return BY_NAME.get(normalise(raw));
}
