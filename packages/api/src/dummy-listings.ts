// Dummy listings — used when Supabase is not initialised (no env vars set yet, before Phase 15
// live-verification). Mirrors `supabase/seed.sql` content so the explore feed, listing detail,
// and the host/admin dashboards all render with plausible data out-of-the-box.
//
// Deterministic IDs so /listing/<id> deep-links are stable across reloads.

import type { Listing, ListingPhoto } from '@bnb/db';

const HOST_ID = '11111111-1111-1111-1111-111111111111';

function photo(listingId: string, slug: string, position: number): ListingPhoto {
  return {
    id: `${listingId}-p${position}`,
    listing_id: listingId,
    url: `https://images.unsplash.com/${slug}?w=1200&q=80&auto=format&fit=crop`,
    position,
  };
}

type Spec = Omit<Listing, 'photos' | 'host_id' | 'created_at'> & { photo_slugs: string[] };

const SPECS: Spec[] = [
  {
    id: 'l-positano-cliffside',
    title: 'Cliffside villa with ocean view',
    description:
      'Perched above the Amalfi coast, this sun-drenched villa sleeps six and has a private infinity pool. Three bedrooms, panoramic terrace, and a five-minute walk to the harbour.',
    price_cents: 42000, currency: 'USD', property_type: 'Villa',
    bedrooms: 3, bathrooms: 2.5, max_guests: 6,
    address: 'Via Mare 18', city: 'Positano', country: 'Italy', lat: 40.6281, lng: 14.4828,
    amenities: ['Beachfront', 'Wifi', 'Kitchen', 'Pool', 'Air conditioning', 'Waterfront', 'BBQ grill'],
    rating_avg: 4.92, rating_count: 128,
    photo_slugs: ['photo-1499793983690-e29da59ef1c2', 'photo-1571896349842-33c89424de2d', 'photo-1582268611958-ebfd161ef9cf'],
  },
  {
    id: 'l-asheville-cabin',
    title: 'Modern cabin in the woods',
    description: 'A-frame retreat surrounded by pine and cedar. Hot tub under the stars. Wood-burning stove. Sleeps four.',
    price_cents: 18500, currency: 'USD', property_type: 'Cabin',
    bedrooms: 2, bathrooms: 1, max_guests: 4,
    address: '72 Pine Ridge Rd', city: 'Asheville', country: 'USA', lat: 35.5951, lng: -82.5515,
    amenities: ['Cabins', 'Wifi', 'Kitchen', 'Hot tub', 'Fireplace', 'Free parking'],
    rating_avg: 4.88, rating_count: 212,
    photo_slugs: ['photo-1518780664697-55e3ad937233', 'photo-1542718610-a1d656d1884c', 'photo-1505691938895-1758d7feb511'],
  },
  {
    id: 'l-queenstown-tiny',
    title: 'Tiny home by the lake',
    description: 'Compact, clever, and beautifully designed, this tiny home sits right on the water. Huge windows, a small dock, and a wood stove.',
    price_cents: 9800, currency: 'USD', property_type: 'Cottage',
    bedrooms: 1, bathrooms: 1, max_guests: 2,
    address: '9 Lakeview Ln', city: 'Queenstown', country: 'New Zealand', lat: -45.0312, lng: 168.6626,
    amenities: ['Tiny homes', 'Wifi', 'Kitchen', 'Waterfront', 'Fireplace'],
    rating_avg: 4.95, rating_count: 87,
    photo_slugs: ['photo-1449158743715-0a90ebb6d2d8', 'photo-1510798831971-661eb04b3739', 'photo-1473773508845-188df298d2d1'],
  },
  {
    id: 'l-costa-treehouse',
    title: 'Treehouse with dreamy views',
    description: 'Float above the canopy in this hand-built treehouse. Every window is a painting.',
    price_cents: 22500, currency: 'USD', property_type: 'Treehouse',
    bedrooms: 1, bathrooms: 1, max_guests: 2,
    address: 'Hidden Grove', city: 'Costa Verde', country: 'Portugal', lat: 41.5558, lng: -8.4229,
    amenities: ['Treehouses', 'Amazing views', 'Wifi', 'Kitchen', 'Workspace'],
    rating_avg: 4.97, rating_count: 54,
    photo_slugs: ['photo-1488462237308-ecaa28b729d7', 'photo-1469854523086-cc02fe5d8800', 'photo-1448630360428-65456885c650'],
  },
  {
    id: 'l-tulum-beach',
    title: 'Beachfront bungalow',
    description: 'Step off the deck into turquoise water. Three bedrooms, room for eight.',
    price_cents: 36500, currency: 'USD', property_type: 'House',
    bedrooms: 3, bathrooms: 2, max_guests: 8,
    address: '48 Palm Walk', city: 'Tulum', country: 'Mexico', lat: 20.2114, lng: -87.4654,
    amenities: ['Beachfront', 'Tropical', 'Wifi', 'Pool', 'Air conditioning', 'BBQ grill', 'Kitchen'],
    rating_avg: 4.81, rating_count: 304,
    photo_slugs: ['photo-1540541338287-41700207dee6', 'photo-1582610116397-edb318620f90', 'photo-1518791841217-8f162f1e1131'],
  },
  {
    id: 'l-berlin-loft',
    title: 'Design-forward city loft',
    description: 'Architect-owned loft in a converted warehouse. Floor-to-ceiling windows, exposed brick, custom millwork.',
    price_cents: 24000, currency: 'USD', property_type: 'Apartment',
    bedrooms: 1, bathrooms: 1, max_guests: 2,
    address: '300 Canal St', city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050,
    amenities: ['Design', 'Wifi', 'Kitchen', 'Workspace', 'Heating', 'Gym'],
    rating_avg: 4.86, rating_count: 176,
    photo_slugs: ['photo-1502672260266-1c1ef2d93688', 'photo-1493663284031-b7e3aefcae8e', 'photo-1505691938895-1758d7feb511'],
  },
  {
    id: 'l-stockholm-island',
    title: 'Private island cottage',
    description: 'Your own slice of the Baltic. Bring supplies — this is proper off-grid.',
    price_cents: 52000, currency: 'USD', property_type: 'Cottage',
    bedrooms: 2, bathrooms: 1, max_guests: 4,
    address: 'Skerry 3', city: 'Stockholm Archipelago', country: 'Sweden', lat: 59.3293, lng: 18.0686,
    amenities: ['Islands', 'Amazing views', 'Waterfront', 'Kitchen'],
    rating_avg: 4.99, rating_count: 41,
    photo_slugs: ['photo-1506905925346-21bda4d32df4', 'photo-1502920917128-1aa500764cbd', 'photo-1502780402662-acc01917a4d3'],
  },
  {
    id: 'l-tuscany-farmhouse',
    title: 'Countryside farmhouse',
    description: 'Slow mornings, long lunches, olive groves. The Tuscan cliché, done right.',
    price_cents: 31000, currency: 'USD', property_type: 'House',
    bedrooms: 4, bathrooms: 3, max_guests: 8,
    address: 'Podere 12', city: "Val d'Orcia", country: 'Italy', lat: 43.0766, lng: 11.6125,
    amenities: ['Countryside', 'Wifi', 'Kitchen', 'Pool', 'Free parking', 'BBQ grill'],
    rating_avg: 4.90, rating_count: 221,
    photo_slugs: ['photo-1568605114967-8130f3a36994', 'photo-1564013799919-ab600027ffc6', 'photo-1505693416388-ac5ce068fe85'],
  },
  {
    id: 'l-aspen-mansion',
    title: 'Modernist mountain mansion',
    description: 'Six bedrooms, panoramic views, private hiking trails.',
    price_cents: 92000, currency: 'USD', property_type: 'Villa',
    bedrooms: 6, bathrooms: 5, max_guests: 12,
    address: '1 Summit Dr', city: 'Aspen', country: 'USA', lat: 39.1911, lng: -106.8175,
    amenities: ['Mansions', 'Amazing views', 'Wifi', 'Hot tub', 'Fireplace', 'Gym'],
    rating_avg: 4.93, rating_count: 63,
    photo_slugs: ['photo-1613490493576-7fde63acd811', 'photo-1600585154340-be6161a56a0c', 'photo-1600596542815-ffad4c1539a9'],
  },
  {
    id: 'l-marrakech-riad',
    title: 'Sun-washed riad',
    description: 'Central courtyard, rooftop terrace, the smell of orange blossom.',
    price_cents: 15500, currency: 'USD', property_type: 'House',
    bedrooms: 3, bathrooms: 2, max_guests: 6,
    address: 'Derb 14', city: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811,
    amenities: ['Design', 'Wifi', 'Pool', 'Kitchen', 'Air conditioning'],
    rating_avg: 4.79, rating_count: 189,
    photo_slugs: ['photo-1539020140153-e479b8c22e70', 'photo-1545158539-39c8d76a8c5b', 'photo-1505873242700-f289a29e1e0f'],
  },
  {
    id: 'l-maldives-overwater',
    title: 'Overwater villa',
    description: 'Glass floor panels, private reef, maximum daydream.',
    price_cents: 78000, currency: 'USD', property_type: 'Villa',
    bedrooms: 1, bathrooms: 1, max_guests: 2,
    address: 'Lagoon 7', city: 'Maldives', country: 'Maldives', lat: 3.2028, lng: 73.2207,
    amenities: ['Tropical', 'Islands', 'Beachfront', 'Wifi', 'Kitchen', 'Air conditioning'],
    rating_avg: 4.98, rating_count: 102,
    photo_slugs: ['photo-1573843981267-be1999ff37cd', 'photo-1582719508461-905c673771fd', 'photo-1540541338287-41700207dee6'],
  },
  {
    id: 'l-chamonix-chalet',
    title: 'Alpine chalet',
    description: 'Ski-in, ski-out. Wood-burning stove. Sauna.',
    price_cents: 28000, currency: 'USD', property_type: 'Cabin',
    bedrooms: 3, bathrooms: 2, max_guests: 6,
    address: 'Chalet 5', city: 'Chamonix', country: 'France', lat: 45.9237, lng: 6.8694,
    amenities: ['Cabins', 'Amazing views', 'Wifi', 'Hot tub', 'Fireplace'],
    rating_avg: 4.87, rating_count: 148,
    photo_slugs: ['photo-1551524559-8af4e6624178', 'photo-1606046604972-77cc76aee944', 'photo-1551524164-687a55dd1126'],
  },
  {
    id: 'l-kyoto-machiya',
    title: 'Kyoto machiya townhouse',
    description: 'Sliding shoji screens, tatami, private garden. A few minutes walk from Nishiki Market.',
    price_cents: 19500, currency: 'USD', property_type: 'House',
    bedrooms: 2, bathrooms: 1, max_guests: 4,
    address: 'Nakagyo 14', city: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681,
    amenities: ['Design', 'Countryside', 'Wifi', 'Kitchen', 'Heating'],
    rating_avg: 4.91, rating_count: 96,
    photo_slugs: ['photo-1528360983277-13d401cdc186', 'photo-1503899036084-c55cdd92da26', 'photo-1503899036084-c55cdd92da26'],
  },
  {
    id: 'l-taos-earthship',
    title: 'Desert earthship',
    description: 'Off-grid eco-home. Solar, rainwater, radical views.',
    price_cents: 14000, currency: 'USD', property_type: 'House',
    bedrooms: 1, bathrooms: 1, max_guests: 2,
    address: 'Mesa 7', city: 'Taos', country: 'USA', lat: 36.4072, lng: -105.5734,
    amenities: ['Amazing views', 'Countryside', 'Wifi', 'Kitchen'],
    rating_avg: 4.82, rating_count: 71,
    photo_slugs: ['photo-1469474968028-56623f02e42e', 'photo-1500382017468-9049fed747ef', 'photo-1502082553048-f009c37129b9'],
  },
  {
    id: 'l-paros-white',
    title: 'Greek island whitewash',
    description: 'Cycladic dream — blue doors, bougainvillea, sunset from the roof.',
    price_cents: 21500, currency: 'USD', property_type: 'House',
    bedrooms: 2, bathrooms: 1, max_guests: 4,
    address: 'Chora 3', city: 'Paros', country: 'Greece', lat: 37.0856, lng: 25.1494,
    amenities: ['Islands', 'Beachfront', 'Wifi', 'Kitchen', 'Air conditioning'],
    rating_avg: 4.88, rating_count: 133,
    photo_slugs: ['photo-1533105079780-92b9be482077', 'photo-1571406384350-a8e94c7e8e88', 'photo-1601581875309-fafbf2d3ed3a'],
  },
  {
    id: 'l-geiranger-fjord',
    title: 'Norwegian fjord cabin',
    description: 'Red timber walls, a dock, northern lights in winter.',
    price_cents: 17000, currency: 'USD', property_type: 'Cabin',
    bedrooms: 2, bathrooms: 1, max_guests: 4,
    address: 'Fjord 9', city: 'Geiranger', country: 'Norway', lat: 62.1007, lng: 7.2048,
    amenities: ['Cabins', 'Amazing views', 'Waterfront', 'Wifi', 'Fireplace'],
    rating_avg: 4.94, rating_count: 58,
    photo_slugs: ['photo-1601581875039-e899893d520c', 'photo-1505321858497-93ad44a37b9c', 'photo-1551524559-8af4e6624178'],
  },
];

const CREATED_AT = '2026-01-15T00:00:00.000Z';

export const DUMMY_LISTINGS: Listing[] = SPECS.map((s) => {
  const photos: ListingPhoto[] = s.photo_slugs.map((slug, i) => photo(s.id, slug, i));
  return {
    id: s.id,
    host_id: HOST_ID,
    title: s.title,
    description: s.description,
    price_cents: s.price_cents,
    currency: s.currency,
    property_type: s.property_type,
    bedrooms: s.bedrooms,
    bathrooms: s.bathrooms,
    max_guests: s.max_guests,
    address: s.address,
    city: s.city,
    country: s.country,
    lat: s.lat,
    lng: s.lng,
    amenities: s.amenities,
    rating_avg: s.rating_avg,
    rating_count: s.rating_count,
    created_at: CREATED_AT,
    photos,
  };
});

export function findDummyListing(id: string): Listing | null {
  return DUMMY_LISTINGS.find((l) => l.id === id) ?? null;
}
