// Static world places table — the OFFLINE / FALLBACK source for destination
// search. A live Supabase-backed exhaustive search sits in front of this; this
// file ships *in the JS bundle* (no network, no Supabase) so the typeahead and
// the "popular destinations" seed always work — even with zero signal, on first
// paint, and before any query reaches the server.
//
// WORLD_COUNTRIES is all 195 UN member + observer states (193 members + the
// Holy See / Vatican + Palestine). WORLD_CITIES is a curated set of each
// country's capital plus its largest / most-visited cities. Names use the
// widely-recognized English form (e.g. "Munich", not "München"); `admin` is set
// only to disambiguate well-known duplicates. `rank` (1 = most prominent ..
// 5 = least) orders typeahead suggestions: capitals & megacities are 1-2.
//
// Treat this as a convenience index, not an authority: it is intentionally
// curated, not exhaustive, and the online search remains the primary route.

export type Country = {
  /** ISO 3166-1 alpha-2, uppercase. */
  code: string;
  name: string;
  /** Continent/region grouping, e.g. 'Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania', 'Middle East'. */
  region: string;
};

export type City = {
  name: string;
  /** Display country name (must match a Country.name). */
  country: string;
  /** ISO 3166-1 alpha-2 of the country, uppercase. */
  code: string;
  /** Optional state/province/admin region for disambiguation, e.g. 'Texas'. */
  admin?: string;
  /** Popularity rank 1 (most prominent) .. 5 (least), used to order typeahead suggestions. Capitals & megacities = 1-2. */
  rank: number;
};

export const WORLD_COUNTRIES: Country[] = [
  { code: 'AF', name: 'Afghanistan', region: 'Asia' },
  { code: 'AL', name: 'Albania', region: 'Europe' },
  { code: 'DZ', name: 'Algeria', region: 'Africa' },
  { code: 'AD', name: 'Andorra', region: 'Europe' },
  { code: 'AO', name: 'Angola', region: 'Africa' },
  { code: 'AG', name: 'Antigua and Barbuda', region: 'North America' },
  { code: 'AR', name: 'Argentina', region: 'South America' },
  { code: 'AM', name: 'Armenia', region: 'Asia' },
  { code: 'AU', name: 'Australia', region: 'Oceania' },
  { code: 'AT', name: 'Austria', region: 'Europe' },
  { code: 'AZ', name: 'Azerbaijan', region: 'Asia' },
  { code: 'BS', name: 'Bahamas', region: 'North America' },
  { code: 'BH', name: 'Bahrain', region: 'Middle East' },
  { code: 'BD', name: 'Bangladesh', region: 'Asia' },
  { code: 'BB', name: 'Barbados', region: 'North America' },
  { code: 'BY', name: 'Belarus', region: 'Europe' },
  { code: 'BE', name: 'Belgium', region: 'Europe' },
  { code: 'BZ', name: 'Belize', region: 'North America' },
  { code: 'BJ', name: 'Benin', region: 'Africa' },
  { code: 'BT', name: 'Bhutan', region: 'Asia' },
  { code: 'BO', name: 'Bolivia', region: 'South America' },
  { code: 'BA', name: 'Bosnia and Herzegovina', region: 'Europe' },
  { code: 'BW', name: 'Botswana', region: 'Africa' },
  { code: 'BR', name: 'Brazil', region: 'South America' },
  { code: 'BN', name: 'Brunei', region: 'Asia' },
  { code: 'BG', name: 'Bulgaria', region: 'Europe' },
  { code: 'BF', name: 'Burkina Faso', region: 'Africa' },
  { code: 'BI', name: 'Burundi', region: 'Africa' },
  { code: 'CV', name: 'Cabo Verde', region: 'Africa' },
  { code: 'KH', name: 'Cambodia', region: 'Asia' },
  { code: 'CM', name: 'Cameroon', region: 'Africa' },
  { code: 'CA', name: 'Canada', region: 'North America' },
  { code: 'CF', name: 'Central African Republic', region: 'Africa' },
  { code: 'TD', name: 'Chad', region: 'Africa' },
  { code: 'CL', name: 'Chile', region: 'South America' },
  { code: 'CN', name: 'China', region: 'Asia' },
  { code: 'CO', name: 'Colombia', region: 'South America' },
  { code: 'KM', name: 'Comoros', region: 'Africa' },
  { code: 'CG', name: 'Congo', region: 'Africa' },
  { code: 'CR', name: 'Costa Rica', region: 'North America' },
  { code: 'CI', name: "Côte d'Ivoire", region: 'Africa' },
  { code: 'HR', name: 'Croatia', region: 'Europe' },
  { code: 'CU', name: 'Cuba', region: 'North America' },
  { code: 'CY', name: 'Cyprus', region: 'Europe' },
  { code: 'CZ', name: 'Czechia', region: 'Europe' },
  { code: 'CD', name: 'Democratic Republic of the Congo', region: 'Africa' },
  { code: 'DK', name: 'Denmark', region: 'Europe' },
  { code: 'DJ', name: 'Djibouti', region: 'Africa' },
  { code: 'DM', name: 'Dominica', region: 'North America' },
  { code: 'DO', name: 'Dominican Republic', region: 'North America' },
  { code: 'EC', name: 'Ecuador', region: 'South America' },
  { code: 'EG', name: 'Egypt', region: 'Africa' },
  { code: 'SV', name: 'El Salvador', region: 'North America' },
  { code: 'GQ', name: 'Equatorial Guinea', region: 'Africa' },
  { code: 'ER', name: 'Eritrea', region: 'Africa' },
  { code: 'EE', name: 'Estonia', region: 'Europe' },
  { code: 'SZ', name: 'Eswatini', region: 'Africa' },
  { code: 'ET', name: 'Ethiopia', region: 'Africa' },
  { code: 'FJ', name: 'Fiji', region: 'Oceania' },
  { code: 'FI', name: 'Finland', region: 'Europe' },
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'GA', name: 'Gabon', region: 'Africa' },
  { code: 'GM', name: 'Gambia', region: 'Africa' },
  { code: 'GE', name: 'Georgia', region: 'Asia' },
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'GH', name: 'Ghana', region: 'Africa' },
  { code: 'GR', name: 'Greece', region: 'Europe' },
  { code: 'GD', name: 'Grenada', region: 'North America' },
  { code: 'GT', name: 'Guatemala', region: 'North America' },
  { code: 'GN', name: 'Guinea', region: 'Africa' },
  { code: 'GW', name: 'Guinea-Bissau', region: 'Africa' },
  { code: 'GY', name: 'Guyana', region: 'South America' },
  { code: 'HT', name: 'Haiti', region: 'North America' },
  { code: 'VA', name: 'Holy See', region: 'Europe' },
  { code: 'HN', name: 'Honduras', region: 'North America' },
  { code: 'HU', name: 'Hungary', region: 'Europe' },
  { code: 'IS', name: 'Iceland', region: 'Europe' },
  { code: 'IN', name: 'India', region: 'Asia' },
  { code: 'ID', name: 'Indonesia', region: 'Asia' },
  { code: 'IR', name: 'Iran', region: 'Middle East' },
  { code: 'IQ', name: 'Iraq', region: 'Middle East' },
  { code: 'IE', name: 'Ireland', region: 'Europe' },
  { code: 'IL', name: 'Israel', region: 'Middle East' },
  { code: 'IT', name: 'Italy', region: 'Europe' },
  { code: 'JM', name: 'Jamaica', region: 'North America' },
  { code: 'JP', name: 'Japan', region: 'Asia' },
  { code: 'JO', name: 'Jordan', region: 'Middle East' },
  { code: 'KZ', name: 'Kazakhstan', region: 'Asia' },
  { code: 'KE', name: 'Kenya', region: 'Africa' },
  { code: 'KI', name: 'Kiribati', region: 'Oceania' },
  { code: 'KW', name: 'Kuwait', region: 'Middle East' },
  { code: 'KG', name: 'Kyrgyzstan', region: 'Asia' },
  { code: 'LA', name: 'Laos', region: 'Asia' },
  { code: 'LV', name: 'Latvia', region: 'Europe' },
  { code: 'LB', name: 'Lebanon', region: 'Middle East' },
  { code: 'LS', name: 'Lesotho', region: 'Africa' },
  { code: 'LR', name: 'Liberia', region: 'Africa' },
  { code: 'LY', name: 'Libya', region: 'Africa' },
  { code: 'LI', name: 'Liechtenstein', region: 'Europe' },
  { code: 'LT', name: 'Lithuania', region: 'Europe' },
  { code: 'LU', name: 'Luxembourg', region: 'Europe' },
  { code: 'MG', name: 'Madagascar', region: 'Africa' },
  { code: 'MW', name: 'Malawi', region: 'Africa' },
  { code: 'MY', name: 'Malaysia', region: 'Asia' },
  { code: 'MV', name: 'Maldives', region: 'Asia' },
  { code: 'ML', name: 'Mali', region: 'Africa' },
  { code: 'MT', name: 'Malta', region: 'Europe' },
  { code: 'MH', name: 'Marshall Islands', region: 'Oceania' },
  { code: 'MR', name: 'Mauritania', region: 'Africa' },
  { code: 'MU', name: 'Mauritius', region: 'Africa' },
  { code: 'MX', name: 'Mexico', region: 'North America' },
  { code: 'FM', name: 'Micronesia', region: 'Oceania' },
  { code: 'MD', name: 'Moldova', region: 'Europe' },
  { code: 'MC', name: 'Monaco', region: 'Europe' },
  { code: 'MN', name: 'Mongolia', region: 'Asia' },
  { code: 'ME', name: 'Montenegro', region: 'Europe' },
  { code: 'MA', name: 'Morocco', region: 'Africa' },
  { code: 'MZ', name: 'Mozambique', region: 'Africa' },
  { code: 'MM', name: 'Myanmar', region: 'Asia' },
  { code: 'NA', name: 'Namibia', region: 'Africa' },
  { code: 'NR', name: 'Nauru', region: 'Oceania' },
  { code: 'NP', name: 'Nepal', region: 'Asia' },
  { code: 'NL', name: 'Netherlands', region: 'Europe' },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania' },
  { code: 'NI', name: 'Nicaragua', region: 'North America' },
  { code: 'NE', name: 'Niger', region: 'Africa' },
  { code: 'NG', name: 'Nigeria', region: 'Africa' },
  { code: 'KP', name: 'North Korea', region: 'Asia' },
  { code: 'MK', name: 'North Macedonia', region: 'Europe' },
  { code: 'NO', name: 'Norway', region: 'Europe' },
  { code: 'OM', name: 'Oman', region: 'Middle East' },
  { code: 'PK', name: 'Pakistan', region: 'Asia' },
  { code: 'PW', name: 'Palau', region: 'Oceania' },
  { code: 'PS', name: 'Palestine', region: 'Middle East' },
  { code: 'PA', name: 'Panama', region: 'North America' },
  { code: 'PG', name: 'Papua New Guinea', region: 'Oceania' },
  { code: 'PY', name: 'Paraguay', region: 'South America' },
  { code: 'PE', name: 'Peru', region: 'South America' },
  { code: 'PH', name: 'Philippines', region: 'Asia' },
  { code: 'PL', name: 'Poland', region: 'Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe' },
  { code: 'QA', name: 'Qatar', region: 'Middle East' },
  { code: 'RO', name: 'Romania', region: 'Europe' },
  { code: 'RU', name: 'Russia', region: 'Europe' },
  { code: 'RW', name: 'Rwanda', region: 'Africa' },
  { code: 'KN', name: 'Saint Kitts and Nevis', region: 'North America' },
  { code: 'LC', name: 'Saint Lucia', region: 'North America' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', region: 'North America' },
  { code: 'WS', name: 'Samoa', region: 'Oceania' },
  { code: 'SM', name: 'San Marino', region: 'Europe' },
  { code: 'ST', name: 'São Tomé and Príncipe', region: 'Africa' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East' },
  { code: 'SN', name: 'Senegal', region: 'Africa' },
  { code: 'RS', name: 'Serbia', region: 'Europe' },
  { code: 'SC', name: 'Seychelles', region: 'Africa' },
  { code: 'SL', name: 'Sierra Leone', region: 'Africa' },
  { code: 'SG', name: 'Singapore', region: 'Asia' },
  { code: 'SK', name: 'Slovakia', region: 'Europe' },
  { code: 'SI', name: 'Slovenia', region: 'Europe' },
  { code: 'SB', name: 'Solomon Islands', region: 'Oceania' },
  { code: 'SO', name: 'Somalia', region: 'Africa' },
  { code: 'ZA', name: 'South Africa', region: 'Africa' },
  { code: 'KR', name: 'South Korea', region: 'Asia' },
  { code: 'SS', name: 'South Sudan', region: 'Africa' },
  { code: 'ES', name: 'Spain', region: 'Europe' },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia' },
  { code: 'SD', name: 'Sudan', region: 'Africa' },
  { code: 'SR', name: 'Suriname', region: 'South America' },
  { code: 'SE', name: 'Sweden', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', region: 'Europe' },
  { code: 'SY', name: 'Syria', region: 'Middle East' },
  { code: 'TJ', name: 'Tajikistan', region: 'Asia' },
  { code: 'TZ', name: 'Tanzania', region: 'Africa' },
  { code: 'TH', name: 'Thailand', region: 'Asia' },
  { code: 'TL', name: 'Timor-Leste', region: 'Asia' },
  { code: 'TG', name: 'Togo', region: 'Africa' },
  { code: 'TO', name: 'Tonga', region: 'Oceania' },
  { code: 'TT', name: 'Trinidad and Tobago', region: 'North America' },
  { code: 'TN', name: 'Tunisia', region: 'Africa' },
  { code: 'TR', name: 'Turkey', region: 'Asia' },
  { code: 'TM', name: 'Turkmenistan', region: 'Asia' },
  { code: 'TV', name: 'Tuvalu', region: 'Oceania' },
  { code: 'UG', name: 'Uganda', region: 'Africa' },
  { code: 'UA', name: 'Ukraine', region: 'Europe' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe' },
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'UY', name: 'Uruguay', region: 'South America' },
  { code: 'UZ', name: 'Uzbekistan', region: 'Asia' },
  { code: 'VU', name: 'Vanuatu', region: 'Oceania' },
  { code: 'VE', name: 'Venezuela', region: 'South America' },
  { code: 'VN', name: 'Vietnam', region: 'Asia' },
  { code: 'YE', name: 'Yemen', region: 'Middle East' },
  { code: 'ZM', name: 'Zambia', region: 'Africa' },
  { code: 'ZW', name: 'Zimbabwe', region: 'Africa' },
];

export const WORLD_CITIES: City[] = [
  // Afghanistan
  { name: 'Kabul', country: 'Afghanistan', code: 'AF', rank: 2 },
  { name: 'Kandahar', country: 'Afghanistan', code: 'AF', rank: 4 },
  { name: 'Herat', country: 'Afghanistan', code: 'AF', rank: 4 },
  { name: 'Mazar-i-Sharif', country: 'Afghanistan', code: 'AF', rank: 4 },

  // Albania
  { name: 'Tirana', country: 'Albania', code: 'AL', rank: 2 },
  { name: 'Durrës', country: 'Albania', code: 'AL', rank: 4 },
  { name: 'Vlorë', country: 'Albania', code: 'AL', rank: 4 },
  { name: 'Sarandë', country: 'Albania', code: 'AL', rank: 4 },

  // Algeria
  { name: 'Algiers', country: 'Algeria', code: 'DZ', rank: 2 },
  { name: 'Oran', country: 'Algeria', code: 'DZ', rank: 3 },
  { name: 'Constantine', country: 'Algeria', code: 'DZ', rank: 4 },
  { name: 'Annaba', country: 'Algeria', code: 'DZ', rank: 4 },

  // Andorra
  { name: 'Andorra la Vella', country: 'Andorra', code: 'AD', rank: 3 },

  // Angola
  { name: 'Luanda', country: 'Angola', code: 'AO', rank: 2 },
  { name: 'Huambo', country: 'Angola', code: 'AO', rank: 4 },
  { name: 'Lobito', country: 'Angola', code: 'AO', rank: 4 },
  { name: 'Benguela', country: 'Angola', code: 'AO', rank: 4 },

  // Antigua and Barbuda
  { name: "St. John's", country: 'Antigua and Barbuda', code: 'AG', rank: 3 },

  // Argentina
  { name: 'Buenos Aires', country: 'Argentina', code: 'AR', rank: 1 },
  { name: 'Córdoba', country: 'Argentina', code: 'AR', admin: 'Córdoba', rank: 3 },
  { name: 'Rosario', country: 'Argentina', code: 'AR', rank: 3 },
  { name: 'Mendoza', country: 'Argentina', code: 'AR', rank: 3 },
  { name: 'San Carlos de Bariloche', country: 'Argentina', code: 'AR', rank: 3 },
  { name: 'Mar del Plata', country: 'Argentina', code: 'AR', rank: 4 },
  { name: 'Salta', country: 'Argentina', code: 'AR', rank: 4 },
  { name: 'Ushuaia', country: 'Argentina', code: 'AR', rank: 4 },
  { name: 'La Plata', country: 'Argentina', code: 'AR', rank: 4 },
  { name: 'El Calafate', country: 'Argentina', code: 'AR', rank: 4 },

  // Armenia
  { name: 'Yerevan', country: 'Armenia', code: 'AM', rank: 2 },
  { name: 'Gyumri', country: 'Armenia', code: 'AM', rank: 4 },

  // Australia
  { name: 'Sydney', country: 'Australia', code: 'AU', admin: 'New South Wales', rank: 1 },
  { name: 'Melbourne', country: 'Australia', code: 'AU', admin: 'Victoria', rank: 1 },
  { name: 'Brisbane', country: 'Australia', code: 'AU', admin: 'Queensland', rank: 2 },
  { name: 'Perth', country: 'Australia', code: 'AU', admin: 'Western Australia', rank: 2 },
  { name: 'Adelaide', country: 'Australia', code: 'AU', admin: 'South Australia', rank: 3 },
  { name: 'Canberra', country: 'Australia', code: 'AU', rank: 2 },
  { name: 'Gold Coast', country: 'Australia', code: 'AU', admin: 'Queensland', rank: 3 },
  { name: 'Cairns', country: 'Australia', code: 'AU', admin: 'Queensland', rank: 3 },
  { name: 'Hobart', country: 'Australia', code: 'AU', admin: 'Tasmania', rank: 3 },
  { name: 'Darwin', country: 'Australia', code: 'AU', admin: 'Northern Territory', rank: 4 },

  // Austria
  { name: 'Vienna', country: 'Austria', code: 'AT', rank: 1 },
  { name: 'Salzburg', country: 'Austria', code: 'AT', rank: 2 },
  { name: 'Innsbruck', country: 'Austria', code: 'AT', rank: 3 },
  { name: 'Graz', country: 'Austria', code: 'AT', rank: 3 },
  { name: 'Linz', country: 'Austria', code: 'AT', rank: 4 },

  // Azerbaijan
  { name: 'Baku', country: 'Azerbaijan', code: 'AZ', rank: 2 },
  { name: 'Ganja', country: 'Azerbaijan', code: 'AZ', rank: 4 },

  // Bahamas
  { name: 'Nassau', country: 'Bahamas', code: 'BS', rank: 2 },
  { name: 'Freeport', country: 'Bahamas', code: 'BS', rank: 4 },

  // Bahrain
  { name: 'Manama', country: 'Bahrain', code: 'BH', rank: 2 },

  // Bangladesh
  { name: 'Dhaka', country: 'Bangladesh', code: 'BD', rank: 1 },
  { name: 'Chittagong', country: 'Bangladesh', code: 'BD', rank: 3 },
  { name: 'Khulna', country: 'Bangladesh', code: 'BD', rank: 4 },
  { name: 'Sylhet', country: 'Bangladesh', code: 'BD', rank: 4 },

  // Barbados
  { name: 'Bridgetown', country: 'Barbados', code: 'BB', rank: 3 },

  // Belarus
  { name: 'Minsk', country: 'Belarus', code: 'BY', rank: 2 },
  { name: 'Gomel', country: 'Belarus', code: 'BY', rank: 4 },
  { name: 'Brest', country: 'Belarus', code: 'BY', rank: 4 },

  // Belgium
  { name: 'Brussels', country: 'Belgium', code: 'BE', rank: 1 },
  { name: 'Antwerp', country: 'Belgium', code: 'BE', rank: 2 },
  { name: 'Bruges', country: 'Belgium', code: 'BE', rank: 2 },
  { name: 'Ghent', country: 'Belgium', code: 'BE', rank: 3 },
  { name: 'Liège', country: 'Belgium', code: 'BE', rank: 4 },

  // Belize
  { name: 'Belmopan', country: 'Belize', code: 'BZ', rank: 3 },
  { name: 'Belize City', country: 'Belize', code: 'BZ', rank: 3 },

  // Benin
  { name: 'Porto-Novo', country: 'Benin', code: 'BJ', rank: 3 },
  { name: 'Cotonou', country: 'Benin', code: 'BJ', rank: 3 },

  // Bhutan
  { name: 'Thimphu', country: 'Bhutan', code: 'BT', rank: 3 },
  { name: 'Paro', country: 'Bhutan', code: 'BT', rank: 4 },

  // Bolivia
  { name: 'La Paz', country: 'Bolivia', code: 'BO', rank: 2 },
  { name: 'Sucre', country: 'Bolivia', code: 'BO', rank: 3 },
  { name: 'Santa Cruz de la Sierra', country: 'Bolivia', code: 'BO', rank: 3 },
  { name: 'Cochabamba', country: 'Bolivia', code: 'BO', rank: 4 },

  // Bosnia and Herzegovina
  { name: 'Sarajevo', country: 'Bosnia and Herzegovina', code: 'BA', rank: 2 },
  { name: 'Mostar', country: 'Bosnia and Herzegovina', code: 'BA', rank: 3 },
  { name: 'Banja Luka', country: 'Bosnia and Herzegovina', code: 'BA', rank: 4 },

  // Botswana
  { name: 'Gaborone', country: 'Botswana', code: 'BW', rank: 3 },
  { name: 'Francistown', country: 'Botswana', code: 'BW', rank: 4 },
  { name: 'Maun', country: 'Botswana', code: 'BW', rank: 4 },

  // Brazil
  { name: 'São Paulo', country: 'Brazil', code: 'BR', rank: 1 },
  { name: 'Rio de Janeiro', country: 'Brazil', code: 'BR', rank: 1 },
  { name: 'Brasília', country: 'Brazil', code: 'BR', rank: 2 },
  { name: 'Salvador', country: 'Brazil', code: 'BR', admin: 'Bahia', rank: 3 },
  { name: 'Fortaleza', country: 'Brazil', code: 'BR', rank: 3 },
  { name: 'Belo Horizonte', country: 'Brazil', code: 'BR', rank: 3 },
  { name: 'Manaus', country: 'Brazil', code: 'BR', rank: 3 },
  { name: 'Recife', country: 'Brazil', code: 'BR', rank: 3 },
  { name: 'Curitiba', country: 'Brazil', code: 'BR', rank: 4 },
  { name: 'Porto Alegre', country: 'Brazil', code: 'BR', rank: 4 },

  // Brunei
  { name: 'Bandar Seri Begawan', country: 'Brunei', code: 'BN', rank: 3 },

  // Bulgaria
  { name: 'Sofia', country: 'Bulgaria', code: 'BG', rank: 2 },
  { name: 'Plovdiv', country: 'Bulgaria', code: 'BG', rank: 3 },
  { name: 'Varna', country: 'Bulgaria', code: 'BG', rank: 3 },
  { name: 'Burgas', country: 'Bulgaria', code: 'BG', rank: 4 },

  // Burkina Faso
  { name: 'Ouagadougou', country: 'Burkina Faso', code: 'BF', rank: 3 },
  { name: 'Bobo-Dioulasso', country: 'Burkina Faso', code: 'BF', rank: 4 },

  // Burundi
  { name: 'Gitega', country: 'Burundi', code: 'BI', rank: 3 },
  { name: 'Bujumbura', country: 'Burundi', code: 'BI', rank: 3 },

  // Cabo Verde
  { name: 'Praia', country: 'Cabo Verde', code: 'CV', rank: 3 },
  { name: 'Mindelo', country: 'Cabo Verde', code: 'CV', rank: 4 },

  // Cambodia
  { name: 'Phnom Penh', country: 'Cambodia', code: 'KH', rank: 2 },
  { name: 'Siem Reap', country: 'Cambodia', code: 'KH', rank: 2 },
  { name: 'Sihanoukville', country: 'Cambodia', code: 'KH', rank: 4 },
  { name: 'Battambang', country: 'Cambodia', code: 'KH', rank: 4 },

  // Cameroon
  { name: 'Yaoundé', country: 'Cameroon', code: 'CM', rank: 3 },
  { name: 'Douala', country: 'Cameroon', code: 'CM', rank: 3 },

  // Canada
  { name: 'Toronto', country: 'Canada', code: 'CA', admin: 'Ontario', rank: 1 },
  { name: 'Montreal', country: 'Canada', code: 'CA', admin: 'Quebec', rank: 1 },
  { name: 'Vancouver', country: 'Canada', code: 'CA', admin: 'British Columbia', rank: 1 },
  { name: 'Ottawa', country: 'Canada', code: 'CA', admin: 'Ontario', rank: 2 },
  { name: 'Calgary', country: 'Canada', code: 'CA', admin: 'Alberta', rank: 3 },
  { name: 'Edmonton', country: 'Canada', code: 'CA', admin: 'Alberta', rank: 3 },
  { name: 'Quebec City', country: 'Canada', code: 'CA', admin: 'Quebec', rank: 3 },
  { name: 'Winnipeg', country: 'Canada', code: 'CA', admin: 'Manitoba', rank: 4 },
  { name: 'Halifax', country: 'Canada', code: 'CA', admin: 'Nova Scotia', rank: 4 },
  { name: 'Victoria', country: 'Canada', code: 'CA', admin: 'British Columbia', rank: 4 },

  // Central African Republic
  { name: 'Bangui', country: 'Central African Republic', code: 'CF', rank: 3 },

  // Chad
  { name: "N'Djamena", country: 'Chad', code: 'TD', rank: 3 },

  // Chile
  { name: 'Santiago', country: 'Chile', code: 'CL', rank: 1 },
  { name: 'Valparaíso', country: 'Chile', code: 'CL', rank: 3 },
  { name: 'Concepción', country: 'Chile', code: 'CL', rank: 4 },
  { name: 'Punta Arenas', country: 'Chile', code: 'CL', rank: 4 },
  { name: 'Antofagasta', country: 'Chile', code: 'CL', rank: 4 },

  // China
  { name: 'Beijing', country: 'China', code: 'CN', rank: 1 },
  { name: 'Shanghai', country: 'China', code: 'CN', rank: 1 },
  { name: 'Guangzhou', country: 'China', code: 'CN', rank: 2 },
  { name: 'Shenzhen', country: 'China', code: 'CN', rank: 2 },
  { name: 'Chengdu', country: 'China', code: 'CN', rank: 3 },
  { name: "Xi'an", country: 'China', code: 'CN', rank: 3 },
  { name: 'Hangzhou', country: 'China', code: 'CN', rank: 3 },
  { name: 'Chongqing', country: 'China', code: 'CN', rank: 3 },
  { name: 'Nanjing', country: 'China', code: 'CN', rank: 4 },
  { name: 'Suzhou', country: 'China', code: 'CN', rank: 4 },
  { name: 'Guilin', country: 'China', code: 'CN', rank: 4 },

  // Colombia
  { name: 'Bogotá', country: 'Colombia', code: 'CO', rank: 1 },
  { name: 'Medellín', country: 'Colombia', code: 'CO', rank: 2 },
  { name: 'Cartagena', country: 'Colombia', code: 'CO', rank: 2 },
  { name: 'Cali', country: 'Colombia', code: 'CO', rank: 3 },
  { name: 'Barranquilla', country: 'Colombia', code: 'CO', rank: 4 },
  { name: 'Santa Marta', country: 'Colombia', code: 'CO', rank: 4 },

  // Comoros
  { name: 'Moroni', country: 'Comoros', code: 'KM', rank: 3 },

  // Congo
  { name: 'Brazzaville', country: 'Congo', code: 'CG', rank: 3 },
  { name: 'Pointe-Noire', country: 'Congo', code: 'CG', rank: 4 },

  // Democratic Republic of the Congo
  { name: 'Kinshasa', country: 'Democratic Republic of the Congo', code: 'CD', rank: 2 },
  { name: 'Lubumbashi', country: 'Democratic Republic of the Congo', code: 'CD', rank: 4 },
  { name: 'Goma', country: 'Democratic Republic of the Congo', code: 'CD', rank: 4 },

  // Costa Rica
  { name: 'San José', country: 'Costa Rica', code: 'CR', rank: 2 },
  { name: 'Liberia', country: 'Costa Rica', code: 'CR', admin: 'Guanacaste', rank: 4 },
  { name: 'La Fortuna', country: 'Costa Rica', code: 'CR', rank: 4 },
  { name: 'Tamarindo', country: 'Costa Rica', code: 'CR', rank: 4 },

  // Côte d'Ivoire
  { name: 'Yamoussoukro', country: "Côte d'Ivoire", code: 'CI', rank: 3 },
  { name: 'Abidjan', country: "Côte d'Ivoire", code: 'CI', rank: 2 },

  // Croatia
  { name: 'Zagreb', country: 'Croatia', code: 'HR', rank: 2 },
  { name: 'Dubrovnik', country: 'Croatia', code: 'HR', rank: 2 },
  { name: 'Split', country: 'Croatia', code: 'HR', rank: 2 },
  { name: 'Zadar', country: 'Croatia', code: 'HR', rank: 3 },
  { name: 'Rijeka', country: 'Croatia', code: 'HR', rank: 4 },

  // Cuba
  { name: 'Havana', country: 'Cuba', code: 'CU', rank: 2 },
  { name: 'Varadero', country: 'Cuba', code: 'CU', rank: 3 },
  { name: 'Santiago de Cuba', country: 'Cuba', code: 'CU', rank: 4 },
  { name: 'Trinidad', country: 'Cuba', code: 'CU', admin: 'Sancti Spíritus', rank: 4 },

  // Cyprus
  { name: 'Nicosia', country: 'Cyprus', code: 'CY', rank: 2 },
  { name: 'Limassol', country: 'Cyprus', code: 'CY', rank: 3 },
  { name: 'Paphos', country: 'Cyprus', code: 'CY', rank: 3 },
  { name: 'Larnaca', country: 'Cyprus', code: 'CY', rank: 4 },

  // Czechia
  { name: 'Prague', country: 'Czechia', code: 'CZ', rank: 1 },
  { name: 'Brno', country: 'Czechia', code: 'CZ', rank: 3 },
  { name: 'Český Krumlov', country: 'Czechia', code: 'CZ', rank: 4 },
  { name: 'Karlovy Vary', country: 'Czechia', code: 'CZ', rank: 4 },

  // Denmark
  { name: 'Copenhagen', country: 'Denmark', code: 'DK', rank: 1 },
  { name: 'Aarhus', country: 'Denmark', code: 'DK', rank: 3 },
  { name: 'Odense', country: 'Denmark', code: 'DK', rank: 4 },
  { name: 'Aalborg', country: 'Denmark', code: 'DK', rank: 4 },

  // Djibouti
  { name: 'Djibouti', country: 'Djibouti', code: 'DJ', rank: 3 },

  // Dominica
  { name: 'Roseau', country: 'Dominica', code: 'DM', rank: 3 },

  // Dominican Republic
  { name: 'Santo Domingo', country: 'Dominican Republic', code: 'DO', rank: 2 },
  { name: 'Punta Cana', country: 'Dominican Republic', code: 'DO', rank: 2 },
  { name: 'Puerto Plata', country: 'Dominican Republic', code: 'DO', rank: 4 },
  { name: 'Santiago de los Caballeros', country: 'Dominican Republic', code: 'DO', rank: 4 },

  // Ecuador
  { name: 'Quito', country: 'Ecuador', code: 'EC', rank: 2 },
  { name: 'Guayaquil', country: 'Ecuador', code: 'EC', rank: 3 },
  { name: 'Cuenca', country: 'Ecuador', code: 'EC', rank: 3 },

  // Egypt
  { name: 'Cairo', country: 'Egypt', code: 'EG', rank: 1 },
  { name: 'Alexandria', country: 'Egypt', code: 'EG', rank: 3 },
  { name: 'Luxor', country: 'Egypt', code: 'EG', rank: 2 },
  { name: 'Aswan', country: 'Egypt', code: 'EG', rank: 3 },
  { name: 'Sharm El Sheikh', country: 'Egypt', code: 'EG', rank: 3 },
  { name: 'Hurghada', country: 'Egypt', code: 'EG', rank: 4 },
  { name: 'Giza', country: 'Egypt', code: 'EG', rank: 2 },

  // El Salvador
  { name: 'San Salvador', country: 'El Salvador', code: 'SV', rank: 3 },

  // Equatorial Guinea
  { name: 'Malabo', country: 'Equatorial Guinea', code: 'GQ', rank: 3 },

  // Eritrea
  { name: 'Asmara', country: 'Eritrea', code: 'ER', rank: 3 },

  // Estonia
  { name: 'Tallinn', country: 'Estonia', code: 'EE', rank: 2 },
  { name: 'Tartu', country: 'Estonia', code: 'EE', rank: 4 },

  // Eswatini
  { name: 'Mbabane', country: 'Eswatini', code: 'SZ', rank: 3 },
  { name: 'Lobamba', country: 'Eswatini', code: 'SZ', rank: 4 },

  // Ethiopia
  { name: 'Addis Ababa', country: 'Ethiopia', code: 'ET', rank: 2 },
  { name: 'Dire Dawa', country: 'Ethiopia', code: 'ET', rank: 4 },
  { name: 'Lalibela', country: 'Ethiopia', code: 'ET', rank: 4 },

  // Fiji
  { name: 'Suva', country: 'Fiji', code: 'FJ', rank: 3 },
  { name: 'Nadi', country: 'Fiji', code: 'FJ', rank: 3 },

  // Finland
  { name: 'Helsinki', country: 'Finland', code: 'FI', rank: 2 },
  { name: 'Tampere', country: 'Finland', code: 'FI', rank: 4 },
  { name: 'Turku', country: 'Finland', code: 'FI', rank: 4 },
  { name: 'Rovaniemi', country: 'Finland', code: 'FI', rank: 3 },

  // France
  { name: 'Paris', country: 'France', code: 'FR', rank: 1 },
  { name: 'Nice', country: 'France', code: 'FR', rank: 2 },
  { name: 'Lyon', country: 'France', code: 'FR', rank: 2 },
  { name: 'Marseille', country: 'France', code: 'FR', rank: 2 },
  { name: 'Bordeaux', country: 'France', code: 'FR', rank: 3 },
  { name: 'Cannes', country: 'France', code: 'FR', rank: 3 },
  { name: 'Strasbourg', country: 'France', code: 'FR', rank: 3 },
  { name: 'Toulouse', country: 'France', code: 'FR', rank: 4 },
  { name: 'Lille', country: 'France', code: 'FR', rank: 4 },

  // Gabon
  { name: 'Libreville', country: 'Gabon', code: 'GA', rank: 3 },

  // Gambia
  { name: 'Banjul', country: 'Gambia', code: 'GM', rank: 3 },
  { name: 'Serekunda', country: 'Gambia', code: 'GM', rank: 4 },

  // Georgia
  { name: 'Tbilisi', country: 'Georgia', code: 'GE', rank: 2 },
  { name: 'Batumi', country: 'Georgia', code: 'GE', rank: 3 },
  { name: 'Kutaisi', country: 'Georgia', code: 'GE', rank: 4 },

  // Germany
  { name: 'Berlin', country: 'Germany', code: 'DE', rank: 1 },
  { name: 'Munich', country: 'Germany', code: 'DE', rank: 1 },
  { name: 'Hamburg', country: 'Germany', code: 'DE', rank: 2 },
  { name: 'Frankfurt', country: 'Germany', code: 'DE', rank: 2 },
  { name: 'Cologne', country: 'Germany', code: 'DE', rank: 3 },
  { name: 'Düsseldorf', country: 'Germany', code: 'DE', rank: 3 },
  { name: 'Stuttgart', country: 'Germany', code: 'DE', rank: 4 },
  { name: 'Dresden', country: 'Germany', code: 'DE', rank: 4 },

  // Ghana
  { name: 'Accra', country: 'Ghana', code: 'GH', rank: 2 },
  { name: 'Kumasi', country: 'Ghana', code: 'GH', rank: 4 },
  { name: 'Cape Coast', country: 'Ghana', code: 'GH', rank: 4 },

  // Greece
  { name: 'Athens', country: 'Greece', code: 'GR', rank: 1 },
  { name: 'Santorini', country: 'Greece', code: 'GR', rank: 1 },
  { name: 'Mykonos', country: 'Greece', code: 'GR', rank: 2 },
  { name: 'Thessaloniki', country: 'Greece', code: 'GR', rank: 3 },
  { name: 'Rhodes', country: 'Greece', code: 'GR', rank: 3 },
  { name: 'Heraklion', country: 'Greece', code: 'GR', admin: 'Crete', rank: 3 },
  { name: 'Corfu', country: 'Greece', code: 'GR', rank: 4 },

  // Grenada
  { name: "St. George's", country: 'Grenada', code: 'GD', rank: 3 },

  // Guatemala
  { name: 'Guatemala City', country: 'Guatemala', code: 'GT', rank: 2 },
  { name: 'Antigua Guatemala', country: 'Guatemala', code: 'GT', rank: 3 },
  { name: 'Quetzaltenango', country: 'Guatemala', code: 'GT', rank: 4 },

  // Guinea
  { name: 'Conakry', country: 'Guinea', code: 'GN', rank: 3 },

  // Guinea-Bissau
  { name: 'Bissau', country: 'Guinea-Bissau', code: 'GW', rank: 3 },

  // Guyana
  { name: 'Georgetown', country: 'Guyana', code: 'GY', rank: 3 },

  // Haiti
  { name: 'Port-au-Prince', country: 'Haiti', code: 'HT', rank: 3 },
  { name: 'Cap-Haïtien', country: 'Haiti', code: 'HT', rank: 4 },

  // Holy See
  { name: 'Vatican City', country: 'Holy See', code: 'VA', rank: 2 },

  // Honduras
  { name: 'Tegucigalpa', country: 'Honduras', code: 'HN', rank: 3 },
  { name: 'San Pedro Sula', country: 'Honduras', code: 'HN', rank: 4 },
  { name: 'Roatán', country: 'Honduras', code: 'HN', rank: 4 },

  // Hungary
  { name: 'Budapest', country: 'Hungary', code: 'HU', rank: 1 },
  { name: 'Debrecen', country: 'Hungary', code: 'HU', rank: 4 },
  { name: 'Szeged', country: 'Hungary', code: 'HU', rank: 4 },

  // Iceland
  { name: 'Reykjavik', country: 'Iceland', code: 'IS', rank: 2 },
  { name: 'Akureyri', country: 'Iceland', code: 'IS', rank: 4 },

  // India
  { name: 'New Delhi', country: 'India', code: 'IN', rank: 1 },
  { name: 'Mumbai', country: 'India', code: 'IN', admin: 'Maharashtra', rank: 1 },
  { name: 'Bangalore', country: 'India', code: 'IN', admin: 'Karnataka', rank: 2 },
  { name: 'Delhi', country: 'India', code: 'IN', rank: 1 },
  { name: 'Chennai', country: 'India', code: 'IN', admin: 'Tamil Nadu', rank: 2 },
  { name: 'Kolkata', country: 'India', code: 'IN', admin: 'West Bengal', rank: 2 },
  { name: 'Hyderabad', country: 'India', code: 'IN', admin: 'Telangana', rank: 2 },
  { name: 'Jaipur', country: 'India', code: 'IN', admin: 'Rajasthan', rank: 2 },
  { name: 'Goa', country: 'India', code: 'IN', rank: 2 },
  { name: 'Agra', country: 'India', code: 'IN', admin: 'Uttar Pradesh', rank: 3 },
  { name: 'Udaipur', country: 'India', code: 'IN', admin: 'Rajasthan', rank: 3 },
  { name: 'Pune', country: 'India', code: 'IN', admin: 'Maharashtra', rank: 4 },

  // Indonesia
  { name: 'Jakarta', country: 'Indonesia', code: 'ID', rank: 1 },
  { name: 'Bali', country: 'Indonesia', code: 'ID', rank: 1 },
  { name: 'Denpasar', country: 'Indonesia', code: 'ID', admin: 'Bali', rank: 2 },
  { name: 'Ubud', country: 'Indonesia', code: 'ID', admin: 'Bali', rank: 2 },
  { name: 'Surabaya', country: 'Indonesia', code: 'ID', rank: 4 },
  { name: 'Yogyakarta', country: 'Indonesia', code: 'ID', rank: 3 },
  { name: 'Bandung', country: 'Indonesia', code: 'ID', rank: 4 },

  // Iran
  { name: 'Tehran', country: 'Iran', code: 'IR', rank: 2 },
  { name: 'Isfahan', country: 'Iran', code: 'IR', rank: 3 },
  { name: 'Shiraz', country: 'Iran', code: 'IR', rank: 3 },
  { name: 'Mashhad', country: 'Iran', code: 'IR', rank: 4 },

  // Iraq
  { name: 'Baghdad', country: 'Iraq', code: 'IQ', rank: 2 },
  { name: 'Basra', country: 'Iraq', code: 'IQ', rank: 4 },
  { name: 'Erbil', country: 'Iraq', code: 'IQ', rank: 4 },

  // Ireland
  { name: 'Dublin', country: 'Ireland', code: 'IE', rank: 1 },
  { name: 'Cork', country: 'Ireland', code: 'IE', rank: 3 },
  { name: 'Galway', country: 'Ireland', code: 'IE', rank: 3 },
  { name: 'Limerick', country: 'Ireland', code: 'IE', rank: 4 },

  // Israel
  { name: 'Jerusalem', country: 'Israel', code: 'IL', rank: 1 },
  { name: 'Tel Aviv', country: 'Israel', code: 'IL', rank: 1 },
  { name: 'Haifa', country: 'Israel', code: 'IL', rank: 3 },
  { name: 'Eilat', country: 'Israel', code: 'IL', rank: 4 },

  // Italy
  { name: 'Rome', country: 'Italy', code: 'IT', rank: 1 },
  { name: 'Venice', country: 'Italy', code: 'IT', rank: 1 },
  { name: 'Florence', country: 'Italy', code: 'IT', rank: 1 },
  { name: 'Milan', country: 'Italy', code: 'IT', rank: 2 },
  { name: 'Naples', country: 'Italy', code: 'IT', rank: 3 },
  { name: 'Turin', country: 'Italy', code: 'IT', rank: 4 },
  { name: 'Bologna', country: 'Italy', code: 'IT', rank: 3 },
  { name: 'Verona', country: 'Italy', code: 'IT', rank: 4 },
  { name: 'Palermo', country: 'Italy', code: 'IT', admin: 'Sicily', rank: 4 },

  // Jamaica
  { name: 'Kingston', country: 'Jamaica', code: 'JM', rank: 2 },
  { name: 'Montego Bay', country: 'Jamaica', code: 'JM', rank: 3 },
  { name: 'Negril', country: 'Jamaica', code: 'JM', rank: 4 },

  // Japan
  { name: 'Tokyo', country: 'Japan', code: 'JP', rank: 1 },
  { name: 'Kyoto', country: 'Japan', code: 'JP', rank: 1 },
  { name: 'Osaka', country: 'Japan', code: 'JP', rank: 2 },
  { name: 'Hiroshima', country: 'Japan', code: 'JP', rank: 3 },
  { name: 'Sapporo', country: 'Japan', code: 'JP', rank: 3 },
  { name: 'Nara', country: 'Japan', code: 'JP', rank: 3 },
  { name: 'Fukuoka', country: 'Japan', code: 'JP', rank: 4 },
  { name: 'Nagoya', country: 'Japan', code: 'JP', rank: 4 },
  { name: 'Yokohama', country: 'Japan', code: 'JP', rank: 4 },

  // Jordan
  { name: 'Amman', country: 'Jordan', code: 'JO', rank: 2 },
  { name: 'Petra', country: 'Jordan', code: 'JO', rank: 1 },
  { name: 'Aqaba', country: 'Jordan', code: 'JO', rank: 4 },

  // Kazakhstan
  { name: 'Astana', country: 'Kazakhstan', code: 'KZ', rank: 2 },
  { name: 'Almaty', country: 'Kazakhstan', code: 'KZ', rank: 2 },
  { name: 'Shymkent', country: 'Kazakhstan', code: 'KZ', rank: 4 },

  // Kenya
  { name: 'Nairobi', country: 'Kenya', code: 'KE', rank: 2 },
  { name: 'Mombasa', country: 'Kenya', code: 'KE', rank: 3 },
  { name: 'Nakuru', country: 'Kenya', code: 'KE', rank: 4 },

  // Kiribati
  { name: 'Tarawa', country: 'Kiribati', code: 'KI', rank: 3 },

  // North Korea
  { name: 'Pyongyang', country: 'North Korea', code: 'KP', rank: 2 },

  // South Korea
  { name: 'Seoul', country: 'South Korea', code: 'KR', rank: 1 },
  { name: 'Busan', country: 'South Korea', code: 'KR', rank: 2 },
  { name: 'Incheon', country: 'South Korea', code: 'KR', rank: 3 },
  { name: 'Jeju City', country: 'South Korea', code: 'KR', admin: 'Jeju', rank: 3 },
  { name: 'Daegu', country: 'South Korea', code: 'KR', rank: 4 },

  // Kuwait
  { name: 'Kuwait City', country: 'Kuwait', code: 'KW', rank: 2 },

  // Kyrgyzstan
  { name: 'Bishkek', country: 'Kyrgyzstan', code: 'KG', rank: 3 },
  { name: 'Osh', country: 'Kyrgyzstan', code: 'KG', rank: 4 },

  // Laos
  { name: 'Vientiane', country: 'Laos', code: 'LA', rank: 3 },
  { name: 'Luang Prabang', country: 'Laos', code: 'LA', rank: 2 },

  // Latvia
  { name: 'Riga', country: 'Latvia', code: 'LV', rank: 2 },
  { name: 'Jūrmala', country: 'Latvia', code: 'LV', rank: 4 },

  // Lebanon
  { name: 'Beirut', country: 'Lebanon', code: 'LB', rank: 2 },
  { name: 'Byblos', country: 'Lebanon', code: 'LB', rank: 4 },

  // Lesotho
  { name: 'Maseru', country: 'Lesotho', code: 'LS', rank: 3 },

  // Liberia
  { name: 'Monrovia', country: 'Liberia', code: 'LR', rank: 3 },

  // Libya
  { name: 'Tripoli', country: 'Libya', code: 'LY', rank: 3 },
  { name: 'Benghazi', country: 'Libya', code: 'LY', rank: 4 },

  // Liechtenstein
  { name: 'Vaduz', country: 'Liechtenstein', code: 'LI', rank: 3 },

  // Lithuania
  { name: 'Vilnius', country: 'Lithuania', code: 'LT', rank: 2 },
  { name: 'Kaunas', country: 'Lithuania', code: 'LT', rank: 4 },

  // Luxembourg
  { name: 'Luxembourg', country: 'Luxembourg', code: 'LU', rank: 2 },

  // Madagascar
  { name: 'Antananarivo', country: 'Madagascar', code: 'MG', rank: 3 },
  { name: 'Toamasina', country: 'Madagascar', code: 'MG', rank: 4 },

  // Malawi
  { name: 'Lilongwe', country: 'Malawi', code: 'MW', rank: 3 },
  { name: 'Blantyre', country: 'Malawi', code: 'MW', rank: 4 },

  // Malaysia
  { name: 'Kuala Lumpur', country: 'Malaysia', code: 'MY', rank: 1 },
  { name: 'George Town', country: 'Malaysia', code: 'MY', admin: 'Penang', rank: 2 },
  { name: 'Malacca City', country: 'Malaysia', code: 'MY', rank: 3 },
  { name: 'Johor Bahru', country: 'Malaysia', code: 'MY', rank: 4 },
  { name: 'Kota Kinabalu', country: 'Malaysia', code: 'MY', admin: 'Sabah', rank: 4 },
  { name: 'Kuching', country: 'Malaysia', code: 'MY', admin: 'Sarawak', rank: 4 },

  // Maldives
  { name: 'Malé', country: 'Maldives', code: 'MV', rank: 2 },

  // Mali
  { name: 'Bamako', country: 'Mali', code: 'ML', rank: 3 },
  { name: 'Timbuktu', country: 'Mali', code: 'ML', rank: 4 },

  // Malta
  { name: 'Valletta', country: 'Malta', code: 'MT', rank: 2 },
  { name: 'Sliema', country: 'Malta', code: 'MT', rank: 4 },

  // Marshall Islands
  { name: 'Majuro', country: 'Marshall Islands', code: 'MH', rank: 3 },

  // Mauritania
  { name: 'Nouakchott', country: 'Mauritania', code: 'MR', rank: 3 },

  // Mauritius
  { name: 'Port Louis', country: 'Mauritius', code: 'MU', rank: 3 },

  // Mexico
  { name: 'Mexico City', country: 'Mexico', code: 'MX', rank: 1 },
  { name: 'Cancún', country: 'Mexico', code: 'MX', admin: 'Quintana Roo', rank: 1 },
  { name: 'Guadalajara', country: 'Mexico', code: 'MX', admin: 'Jalisco', rank: 2 },
  { name: 'Playa del Carmen', country: 'Mexico', code: 'MX', admin: 'Quintana Roo', rank: 2 },
  { name: 'Tulum', country: 'Mexico', code: 'MX', admin: 'Quintana Roo', rank: 2 },
  { name: 'Monterrey', country: 'Mexico', code: 'MX', admin: 'Nuevo León', rank: 3 },
  { name: 'Oaxaca', country: 'Mexico', code: 'MX', rank: 3 },
  { name: 'Puerto Vallarta', country: 'Mexico', code: 'MX', admin: 'Jalisco', rank: 3 },
  { name: 'Mérida', country: 'Mexico', code: 'MX', admin: 'Yucatán', rank: 4 },
  { name: 'San Miguel de Allende', country: 'Mexico', code: 'MX', admin: 'Guanajuato', rank: 4 },

  // Micronesia
  { name: 'Palikir', country: 'Micronesia', code: 'FM', rank: 3 },

  // Moldova
  { name: 'Chișinău', country: 'Moldova', code: 'MD', rank: 3 },

  // Monaco
  { name: 'Monaco', country: 'Monaco', code: 'MC', rank: 2 },
  { name: 'Monte Carlo', country: 'Monaco', code: 'MC', rank: 2 },

  // Mongolia
  { name: 'Ulaanbaatar', country: 'Mongolia', code: 'MN', rank: 3 },

  // Montenegro
  { name: 'Podgorica', country: 'Montenegro', code: 'ME', rank: 3 },
  { name: 'Kotor', country: 'Montenegro', code: 'ME', rank: 3 },
  { name: 'Budva', country: 'Montenegro', code: 'ME', rank: 4 },

  // Morocco
  { name: 'Rabat', country: 'Morocco', code: 'MA', rank: 2 },
  { name: 'Marrakesh', country: 'Morocco', code: 'MA', rank: 1 },
  { name: 'Casablanca', country: 'Morocco', code: 'MA', rank: 2 },
  { name: 'Fez', country: 'Morocco', code: 'MA', rank: 3 },
  { name: 'Chefchaouen', country: 'Morocco', code: 'MA', rank: 3 },
  { name: 'Tangier', country: 'Morocco', code: 'MA', rank: 4 },
  { name: 'Agadir', country: 'Morocco', code: 'MA', rank: 4 },

  // Mozambique
  { name: 'Maputo', country: 'Mozambique', code: 'MZ', rank: 3 },
  { name: 'Beira', country: 'Mozambique', code: 'MZ', rank: 4 },

  // Myanmar
  { name: 'Naypyidaw', country: 'Myanmar', code: 'MM', rank: 3 },
  { name: 'Yangon', country: 'Myanmar', code: 'MM', rank: 2 },
  { name: 'Mandalay', country: 'Myanmar', code: 'MM', rank: 3 },
  { name: 'Bagan', country: 'Myanmar', code: 'MM', rank: 3 },

  // Namibia
  { name: 'Windhoek', country: 'Namibia', code: 'NA', rank: 3 },
  { name: 'Swakopmund', country: 'Namibia', code: 'NA', rank: 4 },

  // Nauru
  { name: 'Yaren', country: 'Nauru', code: 'NR', rank: 3 },

  // Nepal
  { name: 'Kathmandu', country: 'Nepal', code: 'NP', rank: 2 },
  { name: 'Pokhara', country: 'Nepal', code: 'NP', rank: 3 },

  // Netherlands
  { name: 'Amsterdam', country: 'Netherlands', code: 'NL', rank: 1 },
  { name: 'Rotterdam', country: 'Netherlands', code: 'NL', rank: 3 },
  { name: 'The Hague', country: 'Netherlands', code: 'NL', rank: 3 },
  { name: 'Utrecht', country: 'Netherlands', code: 'NL', rank: 4 },

  // New Zealand
  { name: 'Auckland', country: 'New Zealand', code: 'NZ', rank: 1 },
  { name: 'Wellington', country: 'New Zealand', code: 'NZ', rank: 2 },
  { name: 'Queenstown', country: 'New Zealand', code: 'NZ', rank: 2 },
  { name: 'Christchurch', country: 'New Zealand', code: 'NZ', rank: 3 },
  { name: 'Rotorua', country: 'New Zealand', code: 'NZ', rank: 4 },

  // Nicaragua
  { name: 'Managua', country: 'Nicaragua', code: 'NI', rank: 3 },
  { name: 'Granada', country: 'Nicaragua', code: 'NI', rank: 4 },

  // Niger
  { name: 'Niamey', country: 'Niger', code: 'NE', rank: 3 },

  // Nigeria
  { name: 'Abuja', country: 'Nigeria', code: 'NG', rank: 2 },
  { name: 'Lagos', country: 'Nigeria', code: 'NG', rank: 1 },
  { name: 'Kano', country: 'Nigeria', code: 'NG', rank: 4 },
  { name: 'Ibadan', country: 'Nigeria', code: 'NG', rank: 4 },
  { name: 'Port Harcourt', country: 'Nigeria', code: 'NG', rank: 4 },

  // North Macedonia
  { name: 'Skopje', country: 'North Macedonia', code: 'MK', rank: 3 },
  { name: 'Ohrid', country: 'North Macedonia', code: 'MK', rank: 4 },

  // Norway
  { name: 'Oslo', country: 'Norway', code: 'NO', rank: 1 },
  { name: 'Bergen', country: 'Norway', code: 'NO', rank: 2 },
  { name: 'Tromsø', country: 'Norway', code: 'NO', rank: 3 },
  { name: 'Stavanger', country: 'Norway', code: 'NO', rank: 4 },
  { name: 'Trondheim', country: 'Norway', code: 'NO', rank: 4 },

  // Oman
  { name: 'Muscat', country: 'Oman', code: 'OM', rank: 2 },
  { name: 'Salalah', country: 'Oman', code: 'OM', rank: 4 },
  { name: 'Nizwa', country: 'Oman', code: 'OM', rank: 4 },

  // Pakistan
  { name: 'Islamabad', country: 'Pakistan', code: 'PK', rank: 2 },
  { name: 'Karachi', country: 'Pakistan', code: 'PK', rank: 1 },
  { name: 'Lahore', country: 'Pakistan', code: 'PK', rank: 2 },
  { name: 'Rawalpindi', country: 'Pakistan', code: 'PK', rank: 4 },
  { name: 'Peshawar', country: 'Pakistan', code: 'PK', rank: 4 },

  // Palau
  { name: 'Ngerulmud', country: 'Palau', code: 'PW', rank: 3 },
  { name: 'Koror', country: 'Palau', code: 'PW', rank: 3 },

  // Palestine
  { name: 'Ramallah', country: 'Palestine', code: 'PS', rank: 3 },
  { name: 'Bethlehem', country: 'Palestine', code: 'PS', rank: 2 },
  { name: 'Gaza', country: 'Palestine', code: 'PS', rank: 3 },

  // Panama
  { name: 'Panama City', country: 'Panama', code: 'PA', rank: 2 },
  { name: 'Bocas del Toro', country: 'Panama', code: 'PA', rank: 4 },

  // Papua New Guinea
  { name: 'Port Moresby', country: 'Papua New Guinea', code: 'PG', rank: 3 },

  // Paraguay
  { name: 'Asunción', country: 'Paraguay', code: 'PY', rank: 3 },

  // Peru
  { name: 'Lima', country: 'Peru', code: 'PE', rank: 1 },
  { name: 'Cusco', country: 'Peru', code: 'PE', rank: 1 },
  { name: 'Arequipa', country: 'Peru', code: 'PE', rank: 3 },
  { name: 'Machu Picchu', country: 'Peru', code: 'PE', rank: 1 },
  { name: 'Trujillo', country: 'Peru', code: 'PE', rank: 4 },

  // Philippines
  { name: 'Manila', country: 'Philippines', code: 'PH', rank: 1 },
  { name: 'Cebu City', country: 'Philippines', code: 'PH', rank: 2 },
  { name: 'Boracay', country: 'Philippines', code: 'PH', rank: 2 },
  { name: 'Davao City', country: 'Philippines', code: 'PH', rank: 4 },
  { name: 'Palawan', country: 'Philippines', code: 'PH', rank: 3 },
  { name: 'Quezon City', country: 'Philippines', code: 'PH', rank: 4 },

  // Poland
  { name: 'Warsaw', country: 'Poland', code: 'PL', rank: 1 },
  { name: 'Kraków', country: 'Poland', code: 'PL', rank: 1 },
  { name: 'Gdańsk', country: 'Poland', code: 'PL', rank: 3 },
  { name: 'Wrocław', country: 'Poland', code: 'PL', rank: 3 },
  { name: 'Poznań', country: 'Poland', code: 'PL', rank: 4 },

  // Portugal
  { name: 'Lisbon', country: 'Portugal', code: 'PT', rank: 1 },
  { name: 'Porto', country: 'Portugal', code: 'PT', rank: 1 },
  { name: 'Faro', country: 'Portugal', code: 'PT', admin: 'Algarve', rank: 3 },
  { name: 'Funchal', country: 'Portugal', code: 'PT', admin: 'Madeira', rank: 3 },
  { name: 'Sintra', country: 'Portugal', code: 'PT', rank: 3 },
  { name: 'Coimbra', country: 'Portugal', code: 'PT', rank: 4 },

  // Qatar
  { name: 'Doha', country: 'Qatar', code: 'QA', rank: 2 },

  // Romania
  { name: 'Bucharest', country: 'Romania', code: 'RO', rank: 2 },
  { name: 'Brașov', country: 'Romania', code: 'RO', rank: 3 },
  { name: 'Cluj-Napoca', country: 'Romania', code: 'RO', rank: 4 },
  { name: 'Sibiu', country: 'Romania', code: 'RO', rank: 4 },

  // Russia
  { name: 'Moscow', country: 'Russia', code: 'RU', rank: 1 },
  { name: 'Saint Petersburg', country: 'Russia', code: 'RU', rank: 1 },
  { name: 'Novosibirsk', country: 'Russia', code: 'RU', rank: 4 },
  { name: 'Yekaterinburg', country: 'Russia', code: 'RU', rank: 4 },
  { name: 'Kazan', country: 'Russia', code: 'RU', rank: 3 },
  { name: 'Sochi', country: 'Russia', code: 'RU', rank: 3 },
  { name: 'Vladivostok', country: 'Russia', code: 'RU', rank: 4 },

  // Rwanda
  { name: 'Kigali', country: 'Rwanda', code: 'RW', rank: 3 },

  // Saint Kitts and Nevis
  { name: 'Basseterre', country: 'Saint Kitts and Nevis', code: 'KN', rank: 3 },

  // Saint Lucia
  { name: 'Castries', country: 'Saint Lucia', code: 'LC', rank: 3 },

  // Saint Vincent and the Grenadines
  { name: 'Kingstown', country: 'Saint Vincent and the Grenadines', code: 'VC', rank: 3 },

  // Samoa
  { name: 'Apia', country: 'Samoa', code: 'WS', rank: 3 },

  // San Marino
  { name: 'San Marino', country: 'San Marino', code: 'SM', rank: 3 },

  // São Tomé and Príncipe
  { name: 'São Tomé', country: 'São Tomé and Príncipe', code: 'ST', rank: 3 },

  // Saudi Arabia
  { name: 'Riyadh', country: 'Saudi Arabia', code: 'SA', rank: 2 },
  { name: 'Jeddah', country: 'Saudi Arabia', code: 'SA', rank: 2 },
  { name: 'Mecca', country: 'Saudi Arabia', code: 'SA', rank: 1 },
  { name: 'Medina', country: 'Saudi Arabia', code: 'SA', rank: 2 },
  { name: 'Dammam', country: 'Saudi Arabia', code: 'SA', rank: 4 },

  // Senegal
  { name: 'Dakar', country: 'Senegal', code: 'SN', rank: 3 },

  // Serbia
  { name: 'Belgrade', country: 'Serbia', code: 'RS', rank: 2 },
  { name: 'Novi Sad', country: 'Serbia', code: 'RS', rank: 4 },

  // Seychelles
  { name: 'Victoria', country: 'Seychelles', code: 'SC', rank: 3 },

  // Sierra Leone
  { name: 'Freetown', country: 'Sierra Leone', code: 'SL', rank: 3 },

  // Singapore
  { name: 'Singapore', country: 'Singapore', code: 'SG', rank: 1 },

  // Slovakia
  { name: 'Bratislava', country: 'Slovakia', code: 'SK', rank: 2 },
  { name: 'Košice', country: 'Slovakia', code: 'SK', rank: 4 },

  // Slovenia
  { name: 'Ljubljana', country: 'Slovenia', code: 'SI', rank: 2 },
  { name: 'Bled', country: 'Slovenia', code: 'SI', rank: 3 },
  { name: 'Maribor', country: 'Slovenia', code: 'SI', rank: 4 },

  // Solomon Islands
  { name: 'Honiara', country: 'Solomon Islands', code: 'SB', rank: 3 },

  // Somalia
  { name: 'Mogadishu', country: 'Somalia', code: 'SO', rank: 3 },

  // South Africa
  { name: 'Cape Town', country: 'South Africa', code: 'ZA', rank: 1 },
  { name: 'Johannesburg', country: 'South Africa', code: 'ZA', rank: 2 },
  { name: 'Pretoria', country: 'South Africa', code: 'ZA', rank: 3 },
  { name: 'Durban', country: 'South Africa', code: 'ZA', rank: 3 },
  { name: 'Port Elizabeth', country: 'South Africa', code: 'ZA', rank: 4 },

  // South Sudan
  { name: 'Juba', country: 'South Sudan', code: 'SS', rank: 3 },

  // Spain
  { name: 'Madrid', country: 'Spain', code: 'ES', rank: 1 },
  { name: 'Barcelona', country: 'Spain', code: 'ES', rank: 1 },
  { name: 'Seville', country: 'Spain', code: 'ES', rank: 2 },
  { name: 'Valencia', country: 'Spain', code: 'ES', rank: 2 },
  { name: 'Granada', country: 'Spain', code: 'ES', admin: 'Andalusia', rank: 3 },
  { name: 'Málaga', country: 'Spain', code: 'ES', rank: 3 },
  { name: 'Bilbao', country: 'Spain', code: 'ES', rank: 3 },
  { name: 'Palma', country: 'Spain', code: 'ES', admin: 'Mallorca', rank: 3 },
  { name: 'Ibiza', country: 'Spain', code: 'ES', rank: 3 },

  // Sri Lanka
  { name: 'Colombo', country: 'Sri Lanka', code: 'LK', rank: 2 },
  { name: 'Kandy', country: 'Sri Lanka', code: 'LK', rank: 3 },
  { name: 'Galle', country: 'Sri Lanka', code: 'LK', rank: 3 },
  { name: 'Sri Jayawardenepura Kotte', country: 'Sri Lanka', code: 'LK', rank: 4 },

  // Sudan
  { name: 'Khartoum', country: 'Sudan', code: 'SD', rank: 3 },

  // Suriname
  { name: 'Paramaribo', country: 'Suriname', code: 'SR', rank: 3 },

  // Sweden
  { name: 'Stockholm', country: 'Sweden', code: 'SE', rank: 1 },
  { name: 'Gothenburg', country: 'Sweden', code: 'SE', rank: 3 },
  { name: 'Malmö', country: 'Sweden', code: 'SE', rank: 4 },
  { name: 'Uppsala', country: 'Sweden', code: 'SE', rank: 4 },

  // Switzerland
  { name: 'Zurich', country: 'Switzerland', code: 'CH', rank: 1 },
  { name: 'Geneva', country: 'Switzerland', code: 'CH', rank: 2 },
  { name: 'Bern', country: 'Switzerland', code: 'CH', rank: 2 },
  { name: 'Lucerne', country: 'Switzerland', code: 'CH', rank: 3 },
  { name: 'Interlaken', country: 'Switzerland', code: 'CH', rank: 3 },
  { name: 'Zermatt', country: 'Switzerland', code: 'CH', rank: 3 },
  { name: 'Basel', country: 'Switzerland', code: 'CH', rank: 4 },

  // Syria
  { name: 'Damascus', country: 'Syria', code: 'SY', rank: 2 },
  { name: 'Aleppo', country: 'Syria', code: 'SY', rank: 3 },

  // Tajikistan
  { name: 'Dushanbe', country: 'Tajikistan', code: 'TJ', rank: 3 },

  // Tanzania
  { name: 'Dodoma', country: 'Tanzania', code: 'TZ', rank: 3 },
  { name: 'Dar es Salaam', country: 'Tanzania', code: 'TZ', rank: 2 },
  { name: 'Zanzibar City', country: 'Tanzania', code: 'TZ', rank: 2 },
  { name: 'Arusha', country: 'Tanzania', code: 'TZ', rank: 3 },

  // Thailand
  { name: 'Bangkok', country: 'Thailand', code: 'TH', rank: 1 },
  { name: 'Chiang Mai', country: 'Thailand', code: 'TH', rank: 1 },
  { name: 'Phuket', country: 'Thailand', code: 'TH', rank: 1 },
  { name: 'Pattaya', country: 'Thailand', code: 'TH', rank: 3 },
  { name: 'Krabi', country: 'Thailand', code: 'TH', rank: 3 },
  { name: 'Koh Samui', country: 'Thailand', code: 'TH', rank: 3 },

  // Timor-Leste
  { name: 'Dili', country: 'Timor-Leste', code: 'TL', rank: 3 },

  // Togo
  { name: 'Lomé', country: 'Togo', code: 'TG', rank: 3 },

  // Tonga
  { name: "Nuku'alofa", country: 'Tonga', code: 'TO', rank: 3 },

  // Trinidad and Tobago
  { name: 'Port of Spain', country: 'Trinidad and Tobago', code: 'TT', rank: 3 },

  // Tunisia
  { name: 'Tunis', country: 'Tunisia', code: 'TN', rank: 2 },
  { name: 'Sousse', country: 'Tunisia', code: 'TN', rank: 4 },

  // Turkey
  { name: 'Istanbul', country: 'Turkey', code: 'TR', rank: 1 },
  { name: 'Ankara', country: 'Turkey', code: 'TR', rank: 2 },
  { name: 'Antalya', country: 'Turkey', code: 'TR', rank: 2 },
  { name: 'Cappadocia', country: 'Turkey', code: 'TR', rank: 2 },
  { name: 'Izmir', country: 'Turkey', code: 'TR', rank: 3 },
  { name: 'Bodrum', country: 'Turkey', code: 'TR', rank: 3 },

  // Turkmenistan
  { name: 'Ashgabat', country: 'Turkmenistan', code: 'TM', rank: 3 },

  // Tuvalu
  { name: 'Funafuti', country: 'Tuvalu', code: 'TV', rank: 3 },

  // Uganda
  { name: 'Kampala', country: 'Uganda', code: 'UG', rank: 3 },
  { name: 'Entebbe', country: 'Uganda', code: 'UG', rank: 4 },

  // Ukraine
  { name: 'Kyiv', country: 'Ukraine', code: 'UA', rank: 2 },
  { name: 'Lviv', country: 'Ukraine', code: 'UA', rank: 3 },
  { name: 'Odesa', country: 'Ukraine', code: 'UA', rank: 3 },
  { name: 'Kharkiv', country: 'Ukraine', code: 'UA', rank: 4 },

  // United Arab Emirates
  { name: 'Abu Dhabi', country: 'United Arab Emirates', code: 'AE', rank: 1 },
  { name: 'Dubai', country: 'United Arab Emirates', code: 'AE', rank: 1 },
  { name: 'Sharjah', country: 'United Arab Emirates', code: 'AE', rank: 4 },

  // United Kingdom
  { name: 'London', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 1 },
  { name: 'Edinburgh', country: 'United Kingdom', code: 'GB', admin: 'Scotland', rank: 1 },
  { name: 'Manchester', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 2 },
  { name: 'Glasgow', country: 'United Kingdom', code: 'GB', admin: 'Scotland', rank: 3 },
  { name: 'Liverpool', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 3 },
  { name: 'Birmingham', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 3 },
  { name: 'Oxford', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 3 },
  { name: 'Cambridge', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 3 },
  { name: 'Bristol', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 4 },
  { name: 'Cardiff', country: 'United Kingdom', code: 'GB', admin: 'Wales', rank: 4 },
  { name: 'Belfast', country: 'United Kingdom', code: 'GB', admin: 'Northern Ireland', rank: 4 },

  // United States
  { name: 'New York', country: 'United States', code: 'US', admin: 'New York', rank: 1 },
  { name: 'Los Angeles', country: 'United States', code: 'US', admin: 'California', rank: 1 },
  { name: 'Chicago', country: 'United States', code: 'US', admin: 'Illinois', rank: 1 },
  { name: 'San Francisco', country: 'United States', code: 'US', admin: 'California', rank: 1 },
  { name: 'Las Vegas', country: 'United States', code: 'US', admin: 'Nevada', rank: 1 },
  { name: 'Miami', country: 'United States', code: 'US', admin: 'Florida', rank: 1 },
  { name: 'Washington', country: 'United States', code: 'US', admin: 'D.C.', rank: 2 },
  { name: 'Boston', country: 'United States', code: 'US', admin: 'Massachusetts', rank: 2 },
  { name: 'Seattle', country: 'United States', code: 'US', admin: 'Washington', rank: 2 },
  { name: 'New Orleans', country: 'United States', code: 'US', admin: 'Louisiana', rank: 2 },
  { name: 'Orlando', country: 'United States', code: 'US', admin: 'Florida', rank: 2 },
  { name: 'San Diego', country: 'United States', code: 'US', admin: 'California', rank: 3 },
  { name: 'Austin', country: 'United States', code: 'US', admin: 'Texas', rank: 3 },
  { name: 'Nashville', country: 'United States', code: 'US', admin: 'Tennessee', rank: 3 },
  { name: 'Denver', country: 'United States', code: 'US', admin: 'Colorado', rank: 3 },
  { name: 'Honolulu', country: 'United States', code: 'US', admin: 'Hawaii', rank: 2 },
  { name: 'Houston', country: 'United States', code: 'US', admin: 'Texas', rank: 3 },
  { name: 'Atlanta', country: 'United States', code: 'US', admin: 'Georgia', rank: 3 },
  { name: 'Philadelphia', country: 'United States', code: 'US', admin: 'Pennsylvania', rank: 3 },
  { name: 'Phoenix', country: 'United States', code: 'US', admin: 'Arizona', rank: 4 },
  { name: 'Portland', country: 'United States', code: 'US', admin: 'Oregon', rank: 4 },
  { name: 'Dallas', country: 'United States', code: 'US', admin: 'Texas', rank: 4 },

  // Uruguay
  { name: 'Montevideo', country: 'Uruguay', code: 'UY', rank: 2 },
  { name: 'Punta del Este', country: 'Uruguay', code: 'UY', rank: 3 },

  // Uzbekistan
  { name: 'Tashkent', country: 'Uzbekistan', code: 'UZ', rank: 2 },
  { name: 'Samarkand', country: 'Uzbekistan', code: 'UZ', rank: 2 },
  { name: 'Bukhara', country: 'Uzbekistan', code: 'UZ', rank: 3 },

  // Vanuatu
  { name: 'Port Vila', country: 'Vanuatu', code: 'VU', rank: 3 },

  // Venezuela
  { name: 'Caracas', country: 'Venezuela', code: 'VE', rank: 2 },
  { name: 'Maracaibo', country: 'Venezuela', code: 'VE', rank: 4 },
  { name: 'Valencia', country: 'Venezuela', code: 'VE', admin: 'Carabobo', rank: 4 },

  // Vietnam
  { name: 'Hanoi', country: 'Vietnam', code: 'VN', rank: 1 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', code: 'VN', rank: 1 },
  { name: 'Da Nang', country: 'Vietnam', code: 'VN', rank: 2 },
  { name: 'Hoi An', country: 'Vietnam', code: 'VN', rank: 2 },
  { name: 'Hue', country: 'Vietnam', code: 'VN', rank: 3 },
  { name: 'Nha Trang', country: 'Vietnam', code: 'VN', rank: 4 },

  // Yemen
  { name: "Sana'a", country: 'Yemen', code: 'YE', rank: 3 },
  { name: 'Aden', country: 'Yemen', code: 'YE', rank: 4 },

  // Zambia
  { name: 'Lusaka', country: 'Zambia', code: 'ZM', rank: 3 },
  { name: 'Livingstone', country: 'Zambia', code: 'ZM', rank: 3 },

  // Zimbabwe
  { name: 'Harare', country: 'Zimbabwe', code: 'ZW', rank: 3 },
  { name: 'Bulawayo', country: 'Zimbabwe', code: 'ZW', rank: 4 },
  { name: 'Victoria Falls', country: 'Zimbabwe', code: 'ZW', rank: 2 },

  // ── Supplemental: additional real cities for large / high-tourism countries ──

  // United States (more)
  { name: 'San Antonio', country: 'United States', code: 'US', admin: 'Texas', rank: 4 },
  { name: 'San Jose', country: 'United States', code: 'US', admin: 'California', rank: 4 },
  { name: 'Sacramento', country: 'United States', code: 'US', admin: 'California', rank: 4 },
  { name: 'Charlotte', country: 'United States', code: 'US', admin: 'North Carolina', rank: 4 },
  { name: 'Detroit', country: 'United States', code: 'US', admin: 'Michigan', rank: 4 },
  { name: 'Minneapolis', country: 'United States', code: 'US', admin: 'Minnesota', rank: 4 },
  { name: 'Salt Lake City', country: 'United States', code: 'US', admin: 'Utah', rank: 4 },
  { name: 'Tampa', country: 'United States', code: 'US', admin: 'Florida', rank: 4 },
  { name: 'St. Louis', country: 'United States', code: 'US', admin: 'Missouri', rank: 4 },
  { name: 'Pittsburgh', country: 'United States', code: 'US', admin: 'Pennsylvania', rank: 4 },
  { name: 'Savannah', country: 'United States', code: 'US', admin: 'Georgia', rank: 4 },
  { name: 'Charleston', country: 'United States', code: 'US', admin: 'South Carolina', rank: 4 },
  { name: 'Santa Fe', country: 'United States', code: 'US', admin: 'New Mexico', rank: 4 },
  { name: 'Anchorage', country: 'United States', code: 'US', admin: 'Alaska', rank: 4 },
  { name: 'Kansas City', country: 'United States', code: 'US', admin: 'Missouri', rank: 5 },
  { name: 'Cleveland', country: 'United States', code: 'US', admin: 'Ohio', rank: 5 },
  { name: 'Indianapolis', country: 'United States', code: 'US', admin: 'Indiana', rank: 5 },
  { name: 'Columbus', country: 'United States', code: 'US', admin: 'Ohio', rank: 5 },
  { name: 'Memphis', country: 'United States', code: 'US', admin: 'Tennessee', rank: 5 },
  { name: 'Albuquerque', country: 'United States', code: 'US', admin: 'New Mexico', rank: 5 },
  { name: 'Tucson', country: 'United States', code: 'US', admin: 'Arizona', rank: 5 },
  { name: 'Baltimore', country: 'United States', code: 'US', admin: 'Maryland', rank: 5 },
  { name: 'Milwaukee', country: 'United States', code: 'US', admin: 'Wisconsin', rank: 5 },
  { name: 'Raleigh', country: 'United States', code: 'US', admin: 'North Carolina', rank: 5 },
  { name: 'Fort Lauderdale', country: 'United States', code: 'US', admin: 'Florida', rank: 5 },
  { name: 'Key West', country: 'United States', code: 'US', admin: 'Florida', rank: 4 },

  // Canada (more)
  { name: 'Mississauga', country: 'Canada', code: 'CA', admin: 'Ontario', rank: 5 },
  { name: 'Banff', country: 'Canada', code: 'CA', admin: 'Alberta', rank: 4 },
  { name: 'Whistler', country: 'Canada', code: 'CA', admin: 'British Columbia', rank: 4 },
  { name: 'Niagara Falls', country: 'Canada', code: 'CA', admin: 'Ontario', rank: 4 },
  { name: 'London', country: 'Canada', code: 'CA', admin: 'Ontario', rank: 5 },
  { name: 'Saskatoon', country: 'Canada', code: 'CA', admin: 'Saskatchewan', rank: 5 },
  { name: 'Regina', country: 'Canada', code: 'CA', admin: 'Saskatchewan', rank: 5 },
  { name: "St. John's", country: 'Canada', code: 'CA', admin: 'Newfoundland and Labrador', rank: 5 },

  // Mexico (more)
  { name: 'Cabo San Lucas', country: 'Mexico', code: 'MX', admin: 'Baja California Sur', rank: 3 },
  { name: 'Tijuana', country: 'Mexico', code: 'MX', admin: 'Baja California', rank: 4 },
  { name: 'Puebla', country: 'Mexico', code: 'MX', rank: 4 },
  { name: 'Guanajuato', country: 'Mexico', code: 'MX', rank: 4 },
  { name: 'Acapulco', country: 'Mexico', code: 'MX', admin: 'Guerrero', rank: 4 },
  { name: 'Cozumel', country: 'Mexico', code: 'MX', admin: 'Quintana Roo', rank: 4 },
  { name: 'León', country: 'Mexico', code: 'MX', admin: 'Guanajuato', rank: 5 },
  { name: 'Querétaro', country: 'Mexico', code: 'MX', rank: 5 },

  // Brazil (more)
  { name: 'Florianópolis', country: 'Brazil', code: 'BR', rank: 3 },
  { name: 'Foz do Iguaçu', country: 'Brazil', code: 'BR', rank: 3 },
  { name: 'Natal', country: 'Brazil', code: 'BR', rank: 4 },
  { name: 'Belém', country: 'Brazil', code: 'BR', rank: 5 },
  { name: 'Goiânia', country: 'Brazil', code: 'BR', rank: 5 },
  { name: 'Maceió', country: 'Brazil', code: 'BR', rank: 5 },

  // China (more)
  { name: 'Tianjin', country: 'China', code: 'CN', rank: 4 },
  { name: 'Wuhan', country: 'China', code: 'CN', rank: 4 },
  { name: 'Qingdao', country: 'China', code: 'CN', rank: 4 },
  { name: 'Kunming', country: 'China', code: 'CN', rank: 4 },
  { name: 'Lhasa', country: 'China', code: 'CN', admin: 'Tibet', rank: 3 },
  { name: 'Harbin', country: 'China', code: 'CN', rank: 4 },
  { name: 'Dalian', country: 'China', code: 'CN', rank: 5 },
  { name: 'Shenyang', country: 'China', code: 'CN', rank: 5 },
  { name: 'Sanya', country: 'China', code: 'CN', admin: 'Hainan', rank: 4 },

  // India (more)
  { name: 'Ahmedabad', country: 'India', code: 'IN', admin: 'Gujarat', rank: 4 },
  { name: 'Varanasi', country: 'India', code: 'IN', admin: 'Uttar Pradesh', rank: 3 },
  { name: 'Amritsar', country: 'India', code: 'IN', admin: 'Punjab', rank: 3 },
  { name: 'Kochi', country: 'India', code: 'IN', admin: 'Kerala', rank: 3 },
  { name: 'Jodhpur', country: 'India', code: 'IN', admin: 'Rajasthan', rank: 4 },
  { name: 'Rishikesh', country: 'India', code: 'IN', admin: 'Uttarakhand', rank: 4 },
  { name: 'Surat', country: 'India', code: 'IN', admin: 'Gujarat', rank: 5 },
  { name: 'Lucknow', country: 'India', code: 'IN', admin: 'Uttar Pradesh', rank: 5 },

  // Japan (more)
  { name: 'Kobe', country: 'Japan', code: 'JP', rank: 4 },
  { name: 'Kanazawa', country: 'Japan', code: 'JP', rank: 4 },
  { name: 'Okinawa', country: 'Japan', code: 'JP', rank: 3 },
  { name: 'Nagasaki', country: 'Japan', code: 'JP', rank: 4 },
  { name: 'Sendai', country: 'Japan', code: 'JP', rank: 5 },
  { name: 'Takayama', country: 'Japan', code: 'JP', rank: 5 },

  // United Kingdom (more)
  { name: 'Leeds', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 4 },
  { name: 'Newcastle', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 4 },
  { name: 'Brighton', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 4 },
  { name: 'York', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 4 },
  { name: 'Bath', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 4 },
  { name: 'Inverness', country: 'United Kingdom', code: 'GB', admin: 'Scotland', rank: 5 },
  { name: 'Aberdeen', country: 'United Kingdom', code: 'GB', admin: 'Scotland', rank: 5 },
  { name: 'Nottingham', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 5 },
  { name: 'Sheffield', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 5 },

  // France (more)
  { name: 'Avignon', country: 'France', code: 'FR', rank: 4 },
  { name: 'Aix-en-Provence', country: 'France', code: 'FR', rank: 4 },
  { name: 'Montpellier', country: 'France', code: 'FR', rank: 4 },
  { name: 'Nantes', country: 'France', code: 'FR', rank: 4 },
  { name: 'Chamonix', country: 'France', code: 'FR', rank: 4 },
  { name: 'Biarritz', country: 'France', code: 'FR', rank: 4 },
  { name: 'Annecy', country: 'France', code: 'FR', rank: 4 },

  // Germany (more)
  { name: 'Nuremberg', country: 'Germany', code: 'DE', rank: 4 },
  { name: 'Leipzig', country: 'Germany', code: 'DE', rank: 4 },
  { name: 'Heidelberg', country: 'Germany', code: 'DE', rank: 4 },
  { name: 'Bremen', country: 'Germany', code: 'DE', rank: 5 },
  { name: 'Hannover', country: 'Germany', code: 'DE', rank: 5 },

  // Italy (more)
  { name: 'Pisa', country: 'Italy', code: 'IT', rank: 4 },
  { name: 'Siena', country: 'Italy', code: 'IT', rank: 4 },
  { name: 'Genoa', country: 'Italy', code: 'IT', rank: 4 },
  { name: 'Bari', country: 'Italy', code: 'IT', rank: 5 },
  { name: 'Catania', country: 'Italy', code: 'IT', admin: 'Sicily', rank: 5 },
  { name: 'Sorrento', country: 'Italy', code: 'IT', rank: 4 },

  // Spain (more)
  { name: 'Zaragoza', country: 'Spain', code: 'ES', rank: 4 },
  { name: 'San Sebastián', country: 'Spain', code: 'ES', rank: 3 },
  { name: 'Córdoba', country: 'Spain', code: 'ES', admin: 'Andalusia', rank: 4 },
  { name: 'Toledo', country: 'Spain', code: 'ES', rank: 4 },
  { name: 'Las Palmas', country: 'Spain', code: 'ES', admin: 'Canary Islands', rank: 4 },
  { name: 'Santiago de Compostela', country: 'Spain', code: 'ES', rank: 4 },

  // Australia (more)
  { name: 'Newcastle', country: 'Australia', code: 'AU', admin: 'New South Wales', rank: 5 },
  { name: 'Byron Bay', country: 'Australia', code: 'AU', admin: 'New South Wales', rank: 4 },
  { name: 'Alice Springs', country: 'Australia', code: 'AU', admin: 'Northern Territory', rank: 5 },

  // Russia (more)
  { name: 'Nizhny Novgorod', country: 'Russia', code: 'RU', rank: 5 },
  { name: 'Volgograd', country: 'Russia', code: 'RU', rank: 5 },

  // Indonesia (more)
  { name: 'Medan', country: 'Indonesia', code: 'ID', rank: 5 },
  { name: 'Lombok', country: 'Indonesia', code: 'ID', rank: 4 },

  // Thailand (more)
  { name: 'Ayutthaya', country: 'Thailand', code: 'TH', rank: 4 },
  { name: 'Hua Hin', country: 'Thailand', code: 'TH', rank: 4 },

  // Greece (more)
  { name: 'Crete', country: 'Greece', code: 'GR', rank: 2 },
  { name: 'Nafplio', country: 'Greece', code: 'GR', rank: 5 },

  // Portugal (more)
  { name: 'Lagos', country: 'Portugal', code: 'PT', admin: 'Algarve', rank: 4 },
  { name: 'Braga', country: 'Portugal', code: 'PT', rank: 5 },

  // Turkey (more)
  { name: 'Bursa', country: 'Turkey', code: 'TR', rank: 5 },
  { name: 'Pamukkale', country: 'Turkey', code: 'TR', rank: 3 },

  // Vietnam (more)
  { name: 'Ha Long', country: 'Vietnam', code: 'VN', rank: 3 },
  { name: 'Sapa', country: 'Vietnam', code: 'VN', rank: 4 },

  // ── Supplemental 2: broader secondary-city coverage ──

  // United States (more)
  { name: 'Fort Worth', country: 'United States', code: 'US', admin: 'Texas', rank: 5 },
  { name: 'El Paso', country: 'United States', code: 'US', admin: 'Texas', rank: 5 },
  { name: 'Oklahoma City', country: 'United States', code: 'US', admin: 'Oklahoma', rank: 5 },
  { name: 'Louisville', country: 'United States', code: 'US', admin: 'Kentucky', rank: 5 },
  { name: 'Cincinnati', country: 'United States', code: 'US', admin: 'Ohio', rank: 5 },
  { name: 'Buffalo', country: 'United States', code: 'US', admin: 'New York', rank: 5 },
  { name: 'Virginia Beach', country: 'United States', code: 'US', admin: 'Virginia', rank: 5 },
  { name: 'Aspen', country: 'United States', code: 'US', admin: 'Colorado', rank: 4 },
  { name: 'Palm Springs', country: 'United States', code: 'US', admin: 'California', rank: 4 },
  { name: 'Napa', country: 'United States', code: 'US', admin: 'California', rank: 4 },
  { name: 'Asheville', country: 'United States', code: 'US', admin: 'North Carolina', rank: 4 },
  { name: 'Jacksonville', country: 'United States', code: 'US', admin: 'Florida', rank: 5 },
  { name: 'Newark', country: 'United States', code: 'US', admin: 'New Jersey', rank: 5 },
  { name: 'Providence', country: 'United States', code: 'US', admin: 'Rhode Island', rank: 5 },

  // Canada (more)
  { name: 'Kelowna', country: 'Canada', code: 'CA', admin: 'British Columbia', rank: 5 },
  { name: 'Hamilton', country: 'Canada', code: 'CA', admin: 'Ontario', rank: 5 },
  { name: 'Kingston', country: 'Canada', code: 'CA', admin: 'Ontario', rank: 5 },

  // Germany (more)
  { name: 'Dortmund', country: 'Germany', code: 'DE', rank: 5 },
  { name: 'Essen', country: 'Germany', code: 'DE', rank: 5 },
  { name: 'Freiburg', country: 'Germany', code: 'DE', rank: 5 },

  // France (more)
  { name: 'Toulon', country: 'France', code: 'FR', rank: 5 },
  { name: 'Rouen', country: 'France', code: 'FR', rank: 5 },
  { name: 'Reims', country: 'France', code: 'FR', rank: 5 },
  { name: 'Dijon', country: 'France', code: 'FR', rank: 5 },

  // Spain (more)
  { name: 'Marbella', country: 'Spain', code: 'ES', admin: 'Andalusia', rank: 4 },
  { name: 'Murcia', country: 'Spain', code: 'ES', rank: 5 },
  { name: 'Alicante', country: 'Spain', code: 'ES', rank: 4 },
  { name: 'Santa Cruz de Tenerife', country: 'Spain', code: 'ES', admin: 'Canary Islands', rank: 4 },

  // Italy (more)
  { name: 'Amalfi', country: 'Italy', code: 'IT', rank: 3 },
  { name: 'Positano', country: 'Italy', code: 'IT', rank: 3 },
  { name: 'Como', country: 'Italy', code: 'IT', rank: 4 },
  { name: 'Cinque Terre', country: 'Italy', code: 'IT', rank: 3 },

  // Switzerland (more)
  { name: 'Lausanne', country: 'Switzerland', code: 'CH', rank: 4 },
  { name: 'St. Moritz', country: 'Switzerland', code: 'CH', rank: 4 },

  // Netherlands (more)
  { name: 'Eindhoven', country: 'Netherlands', code: 'NL', rank: 5 },
  { name: 'Maastricht', country: 'Netherlands', code: 'NL', rank: 5 },
  { name: 'Haarlem', country: 'Netherlands', code: 'NL', rank: 5 },

  // Greece (more)
  { name: 'Paros', country: 'Greece', code: 'GR', rank: 4 },
  { name: 'Naxos', country: 'Greece', code: 'GR', rank: 4 },
  { name: 'Chania', country: 'Greece', code: 'GR', admin: 'Crete', rank: 4 },

  // Poland (more)
  { name: 'Łódź', country: 'Poland', code: 'PL', rank: 5 },
  { name: 'Zakopane', country: 'Poland', code: 'PL', rank: 4 },

  // Sweden (more)
  { name: 'Lund', country: 'Sweden', code: 'SE', rank: 5 },

  // Norway (more)
  { name: 'Ålesund', country: 'Norway', code: 'NO', rank: 5 },

  // Japan (more)
  { name: 'Hakone', country: 'Japan', code: 'JP', rank: 4 },
  { name: 'Nikko', country: 'Japan', code: 'JP', rank: 5 },
  { name: 'Kamakura', country: 'Japan', code: 'JP', rank: 5 },

  // South Korea (more)
  { name: 'Gyeongju', country: 'South Korea', code: 'KR', rank: 4 },
  { name: 'Daejeon', country: 'South Korea', code: 'KR', rank: 5 },

  // India (more)
  { name: 'Pushkar', country: 'India', code: 'IN', admin: 'Rajasthan', rank: 4 },
  { name: 'Madurai', country: 'India', code: 'IN', admin: 'Tamil Nadu', rank: 5 },
  { name: 'Nagpur', country: 'India', code: 'IN', admin: 'Maharashtra', rank: 5 },
  { name: 'Shimla', country: 'India', code: 'IN', admin: 'Himachal Pradesh', rank: 4 },

  // China (more)
  { name: 'Guiyang', country: 'China', code: 'CN', rank: 5 },
  { name: 'Zhangjiajie', country: 'China', code: 'CN', rank: 4 },
  { name: 'Xiamen', country: 'China', code: 'CN', rank: 4 },

  // Thailand (more)
  { name: 'Chiang Rai', country: 'Thailand', code: 'TH', rank: 4 },
  { name: 'Koh Phangan', country: 'Thailand', code: 'TH', rank: 4 },

  // Vietnam (more)
  { name: 'Phu Quoc', country: 'Vietnam', code: 'VN', rank: 4 },
  { name: 'Da Lat', country: 'Vietnam', code: 'VN', rank: 4 },

  // Philippines (more)
  { name: 'El Nido', country: 'Philippines', code: 'PH', admin: 'Palawan', rank: 3 },
  { name: 'Siargao', country: 'Philippines', code: 'PH', rank: 4 },

  // Indonesia (more)
  { name: 'Gili Islands', country: 'Indonesia', code: 'ID', rank: 4 },
  { name: 'Komodo', country: 'Indonesia', code: 'ID', rank: 4 },

  // Malaysia (more)
  { name: 'Langkawi', country: 'Malaysia', code: 'MY', rank: 3 },

  // Turkey (more)
  { name: 'Fethiye', country: 'Turkey', code: 'TR', rank: 4 },
  { name: 'Ephesus', country: 'Turkey', code: 'TR', rank: 4 },

  // Morocco (more)
  { name: 'Essaouira', country: 'Morocco', code: 'MA', rank: 4 },
  { name: 'Merzouga', country: 'Morocco', code: 'MA', rank: 4 },

  // Egypt (more)
  { name: 'Dahab', country: 'Egypt', code: 'EG', rank: 4 },

  // South Africa (more)
  { name: 'Stellenbosch', country: 'South Africa', code: 'ZA', rank: 4 },
  { name: 'Knysna', country: 'South Africa', code: 'ZA', rank: 5 },

  // Mexico (more)
  { name: 'Mazatlán', country: 'Mexico', code: 'MX', admin: 'Sinaloa', rank: 4 },
  { name: 'Sayulita', country: 'Mexico', code: 'MX', admin: 'Nayarit', rank: 4 },

  // Colombia (more)
  { name: 'Bucaramanga', country: 'Colombia', code: 'CO', rank: 5 },
  { name: 'San Andrés', country: 'Colombia', code: 'CO', rank: 4 },

  // Peru (more)
  { name: 'Iquitos', country: 'Peru', code: 'PE', rank: 4 },
  { name: 'Puno', country: 'Peru', code: 'PE', rank: 4 },

  // Chile (more)
  { name: 'San Pedro de Atacama', country: 'Chile', code: 'CL', rank: 4 },
  { name: 'Puerto Varas', country: 'Chile', code: 'CL', rank: 5 },

  // Argentina (more)
  { name: 'Puerto Iguazú', country: 'Argentina', code: 'AR', rank: 4 },

  // Croatia (more)
  { name: 'Hvar', country: 'Croatia', code: 'HR', rank: 3 },
  { name: 'Pula', country: 'Croatia', code: 'HR', rank: 4 },

  // Iceland (more)
  { name: 'Vík', country: 'Iceland', code: 'IS', rank: 5 },

  // Ireland (more)
  { name: 'Killarney', country: 'Ireland', code: 'IE', rank: 4 },
  { name: 'Kilkenny', country: 'Ireland', code: 'IE', rank: 5 },

  // ── Supplemental 3: further real cities ──

  // United States (more)
  { name: 'Scottsdale', country: 'United States', code: 'US', admin: 'Arizona', rank: 4 },
  { name: 'Sedona', country: 'United States', code: 'US', admin: 'Arizona', rank: 4 },
  { name: 'Maui', country: 'United States', code: 'US', admin: 'Hawaii', rank: 3 },
  { name: 'Park City', country: 'United States', code: 'US', admin: 'Utah', rank: 4 },
  { name: 'Myrtle Beach', country: 'United States', code: 'US', admin: 'South Carolina', rank: 5 },
  { name: 'Boise', country: 'United States', code: 'US', admin: 'Idaho', rank: 5 },
  { name: 'Reno', country: 'United States', code: 'US', admin: 'Nevada', rank: 5 },
  { name: 'Madison', country: 'United States', code: 'US', admin: 'Wisconsin', rank: 5 },

  // Brazil (more)
  { name: 'Campinas', country: 'Brazil', code: 'BR', rank: 5 },
  { name: 'Búzios', country: 'Brazil', code: 'BR', rank: 4 },

  // China (more)
  { name: 'Hong Kong', country: 'China', code: 'CN', admin: 'Hong Kong', rank: 1 },
  { name: 'Macau', country: 'China', code: 'CN', admin: 'Macau', rank: 2 },

  // India (more)
  { name: 'Mysore', country: 'India', code: 'IN', admin: 'Karnataka', rank: 4 },
  { name: 'Darjeeling', country: 'India', code: 'IN', admin: 'West Bengal', rank: 4 },

  // Japan (more)
  { name: 'Beppu', country: 'Japan', code: 'JP', rank: 5 },

  // United Kingdom (more)
  { name: 'Stratford-upon-Avon', country: 'United Kingdom', code: 'GB', admin: 'England', rank: 5 },

  // France (more)
  { name: 'Saint-Tropez', country: 'France', code: 'FR', rank: 4 },
  { name: 'Colmar', country: 'France', code: 'FR', rank: 4 },

  // Germany (more)
  { name: 'Rothenburg ob der Tauber', country: 'Germany', code: 'DE', rank: 5 },

  // Spain (more)
  { name: 'Ronda', country: 'Spain', code: 'ES', admin: 'Andalusia', rank: 4 },

  // Italy (more)
  { name: 'Lake Garda', country: 'Italy', code: 'IT', rank: 4 },
  { name: 'Lecce', country: 'Italy', code: 'IT', rank: 5 },

  // Portugal (more)
  { name: 'Cascais', country: 'Portugal', code: 'PT', rank: 5 },

  // Greece (more)
  { name: 'Zakynthos', country: 'Greece', code: 'GR', rank: 4 },

  // Austria (more)
  { name: 'Hallstatt', country: 'Austria', code: 'AT', rank: 4 },

  // Switzerland (more)
  { name: 'Grindelwald', country: 'Switzerland', code: 'CH', rank: 4 },

  // Turkey (more)
  { name: 'Marmaris', country: 'Turkey', code: 'TR', rank: 5 },

  // Thailand (more)
  { name: 'Kanchanaburi', country: 'Thailand', code: 'TH', rank: 5 },

  // Indonesia (more)
  { name: 'Makassar', country: 'Indonesia', code: 'ID', rank: 5 },

  // Vietnam (more)
  { name: 'Can Tho', country: 'Vietnam', code: 'VN', rank: 5 },

  // Mexico (more)
  { name: 'Morelia', country: 'Mexico', code: 'MX', admin: 'Michoacán', rank: 5 },

  // Australia (more)
  { name: 'Geelong', country: 'Australia', code: 'AU', admin: 'Victoria', rank: 5 },
  { name: 'Port Douglas', country: 'Australia', code: 'AU', admin: 'Queensland', rank: 5 },
];

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

export const COUNTRY_BY_CODE: Map<string, Country> = new Map(
  WORLD_COUNTRIES.map((c) => [c.code.toUpperCase(), c]),
);

export const COUNTRY_BY_NAME: Map<string, Country> = new Map(
  WORLD_COUNTRIES.map((c) => [normalise(c.name), c]),
);

/** A flat, search-ready list of destination options: every city as "City, Country"
 *  and every country on its own, each with a normalized lowercase haystack and a rank
 *  (countries get rank 2). Cities first (sorted by rank then name), then countries. */
export type PlaceOption = {
  label: string;
  sub: string;
  haystack: string;
  code: string;
  rank: number;
  kind: 'city' | 'country';
};

function buildPlaceOptions(): PlaceOption[] {
  const cityOptions: PlaceOption[] = WORLD_CITIES.map((city) => {
    const country = COUNTRY_BY_CODE.get(city.code.toUpperCase());
    const region = country ? country.region : '';
    const label = `${city.name}, ${city.country}`;
    const sub = region ? `${city.country} · ${region}` : city.country;
    return {
      label,
      sub,
      haystack: `${label} ${sub}`.toLowerCase(),
      code: city.code.toUpperCase(),
      rank: city.rank,
      kind: 'city' as const,
    };
  });

  // Cities first, ordered by rank then name.
  cityOptions.sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label));

  const countryOptions: PlaceOption[] = WORLD_COUNTRIES.map((country) => {
    const label = country.name;
    const sub = country.region;
    return {
      label,
      sub,
      haystack: `${label} ${sub}`.toLowerCase(),
      code: country.code.toUpperCase(),
      rank: 2,
      kind: 'country' as const,
    };
  });

  countryOptions.sort((a, b) => a.label.localeCompare(b.label));

  return [...cityOptions, ...countryOptions];
}

export const PLACE_OPTIONS: PlaceOption[] = buildPlaceOptions();

/** Case-insensitive substring search over PLACE_OPTIONS, ranked: exact/startsWith first,
 *  then by `rank`, then alphabetical. Returns up to `limit` (default 8). */
export function searchPlacesLocal(query: string, limit = 8): PlaceOption[] {
  const q = normalise(query);
  if (!q) return [];

  type Scored = { option: PlaceOption; score: number };
  const matches: Scored[] = [];

  for (const option of PLACE_OPTIONS) {
    const idx = option.haystack.indexOf(q);
    if (idx === -1) continue;

    // Lower score sorts first. Exact label match beats startsWith, which beats
    // a substring hit elsewhere in the haystack.
    let score: number;
    if (option.label.toLowerCase() === q) {
      score = 0;
    } else if (option.label.toLowerCase().startsWith(q)) {
      score = 1;
    } else if (idx === 0) {
      score = 2;
    } else {
      score = 3;
    }
    matches.push({ option, score });
  }

  matches.sort(
    (a, b) =>
      a.score - b.score ||
      a.option.rank - b.option.rank ||
      a.option.label.localeCompare(b.option.label),
  );

  return matches.slice(0, limit).map((m) => m.option);
}
