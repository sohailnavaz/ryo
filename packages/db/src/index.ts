export type { Database } from '../supabase.types';

export type Listing = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  amenities: string[];
  rating_avg: number;
  rating_count: number;
  created_at: string;
  photos: ListingPhoto[];
};

export type ListingPhoto = {
  id: string;
  listing_id: string;
  url: string;
  position: number;
};

export type Booking = {
  id: string;
  listing_id: string;
  guest_id: string;
  start_date: string;
  end_date: string;
  total_cents: number;
  status: 'confirmed' | 'cancelled';
  created_at: string;
};

export type Review = {
  id: string;
  listing_id: string;
  guest_id: string;
  rating: number;
  body: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Category =
  | 'All'
  | 'Beachfront'
  | 'Cabins'
  | 'Tiny homes'
  | 'Amazing views'
  | 'Islands'
  | 'Countryside'
  | 'Design'
  | 'Tropical'
  | 'Mansions'
  | 'Treehouses';

export const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'All', label: 'All', icon: 'compass' },
  { key: 'Beachfront', label: 'Beachfront', icon: 'palmtree' },
  { key: 'Cabins', label: 'Cabins', icon: 'tent' },
  { key: 'Tiny homes', label: 'Tiny homes', icon: 'home' },
  { key: 'Amazing views', label: 'Amazing views', icon: 'mountain' },
  { key: 'Islands', label: 'Islands', icon: 'anchor' },
  { key: 'Countryside', label: 'Countryside', icon: 'flower' },
  { key: 'Design', label: 'Design', icon: 'sparkles' },
  { key: 'Tropical', label: 'Tropical', icon: 'leaf' },
  { key: 'Mansions', label: 'Mansions', icon: 'building' },
  { key: 'Treehouses', label: 'Treehouses', icon: 'trees' },
];

export const AMENITIES = [
  'Wifi',
  'Kitchen',
  'Pool',
  'Hot tub',
  'Free parking',
  'EV charger',
  'Washer',
  'Dryer',
  'Air conditioning',
  'Heating',
  'TV',
  'Workspace',
  'Gym',
  'Fireplace',
  'BBQ grill',
  'Waterfront',
] as const;
