// Curated, synthetic travel content for the Stories tab. No backend — same
// pattern as DUMMY_LISTINGS. Images reuse Unsplash slugs already proven to load
// in the app. When a real content backend lands, this module is replaced.

// Right-sized for cards (~300–420px displayed). Lower w = far less data on
// slow connections — a deliberate low-bandwidth choice for travelers.
const img = (slug: string, w = 640) =>
  `https://images.unsplash.com/${slug}?w=${w}&q=70&auto=format&fit=crop`;

export type SeasonalPick = {
  city: string;
  country: string;
  whyNow: string;
  img: string;
};

export type CityGuide = {
  slug: string;
  city: string;
  title: string;
  author: string;
  readMin: number;
  tags: string[];
  img: string;
};

export type TravelerStory = {
  id: string;
  author: string;
  avatar: string;
  title: string;
  snippet: string;
  img: string;
  saves: number;
};

export type PlanBlock = { title: string; blurb: string };

export type Collection = { title: string; blurb: string; count: number; img: string };

/** "Good right now" — timely, seasonal picks (tone: a well-travelled friend). */
export const SEASONAL_PICKS: SeasonalPick[] = [
  {
    city: 'Kyoto',
    country: 'Japan',
    whyNow: 'Late-spring green maples, mild mornings, and far fewer crowds than autumn.',
    img: img('photo-1545158539-39c8d76a8c5b'),
  },
  {
    city: 'Amalfi Coast',
    country: 'Italy',
    whyNow: 'Warm sea, lemon groves in bloom, the calm before the summer rush.',
    img: img('photo-1499793983690-e29da59ef1c2'),
  },
  {
    city: 'Lisbon',
    country: 'Portugal',
    whyNow: 'Jacarandas in full purple bloom and long, golden evenings on the miradouros.',
    img: img('photo-1502672260266-1c1ef2d93688'),
  },
  {
    city: 'Santorini',
    country: 'Greece',
    whyNow: 'Shoulder-season light, swimmable water, sunsets without the August shoulder-to-shoulder.',
    img: img('photo-1533105079780-92b9be482077'),
  },
];

/** Editorial city guides — magazine-style. */
export const CITY_GUIDES: CityGuide[] = [
  {
    slug: 'kyoto',
    city: 'Kyoto',
    title: "A local's guide to slow mornings in Kyoto",
    author: 'Mira A.',
    readMin: 7,
    tags: ['Historical', 'Temples', 'Tea'],
    img: img('photo-1493976040374-85c8e12f0c0e'),
  },
  {
    slug: 'queenstown',
    city: 'Queenstown',
    title: 'Mountains, lakes & long drives: Queenstown unhurried',
    author: 'Kenji T.',
    readMin: 6,
    tags: ['Mountains', 'Adventure'],
    img: img('photo-1469474968028-56623f02e42e'),
  },
  {
    slug: 'tulum',
    city: 'Tulum',
    title: 'Cenotes, ruins, and where to actually eat in Tulum',
    author: 'Sora M.',
    readMin: 5,
    tags: ['Beach', 'Food', 'History'],
    img: img('photo-1506905925346-21bda4d32df4'),
  },
  {
    slug: 'asheville',
    city: 'Asheville',
    title: 'Blue Ridge cabins and the art of doing nothing',
    author: 'Mira A.',
    readMin: 4,
    tags: ['Cabins', 'Nature', 'Slow'],
    img: img('photo-1518780664697-55e3ad937233'),
  },
];

/** Traveler-posted stories + photos (the user blog feed). */
export const TRAVELER_STORIES: TravelerStory[] = [
  {
    id: 'st-1',
    author: 'Aisha R.',
    avatar: img('photo-1544005313-94ddf0286df2', 200),
    title: 'Three states, one rental car, zero plans',
    snippet: 'We let the weather pick the route. Best decision of the trip — here’s the loop we drove.',
    img: img('photo-1500382017468-9049fed747ef'),
    saves: 214,
  },
  {
    id: 'st-2',
    author: 'Diego F.',
    avatar: img('photo-1507003211169-0a1dd7228f2d', 200),
    title: 'The quiet side of the Amalfi Coast',
    snippet: 'Skip Positano at noon. The villages above the road are where the real mornings happen.',
    img: img('photo-1571896349842-33c89424de2d'),
    saves: 188,
  },
  {
    id: 'st-3',
    author: 'Lena K.',
    avatar: img('photo-1438761681033-6461ffad8d80', 200),
    title: 'A week off-grid in the Blue Ridge',
    snippet: 'No signal, a wood stove, and the best sleep of the year. What I packed and what I’d skip.',
    img: img('photo-1449158743715-0a90ebb6d2d8'),
    saves: 156,
  },
  {
    id: 'st-4',
    author: 'Yuki N.',
    avatar: img('photo-1544005313-94ddf0286df2', 200),
    title: 'Temple-hopping Kyoto on foot',
    snippet: 'Five temples, one long walk, and the matcha that ruined all other matcha for me.',
    img: img('photo-1540541338287-41700207dee6'),
    saves: 142,
  },
  {
    id: 'st-5',
    author: 'Tom B.',
    avatar: img('photo-1507003211169-0a1dd7228f2d', 200),
    title: 'Chasing sunsets across the Cyclades',
    snippet: 'Island-hopped on a whim. Here’s the ferry timing that actually worked.',
    img: img('photo-1469854523086-cc02fe5d8800'),
    saves: 131,
  },
  {
    id: 'st-6',
    author: 'Priya S.',
    avatar: img('photo-1438761681033-6461ffad8d80', 200),
    title: 'Tulum on a budget (yes, really)',
    snippet: 'Cenotes before 9am, tacos away from the beach road, and a casita I’d go back to.',
    img: img('photo-1502920917128-1aa500764cbd'),
    saves: 119,
  },
];

/** Practical "plan your trip" blocks. */
export const PLAN_BLOCKS: PlanBlock[] = [
  { title: 'When to go', blurb: 'Shoulder seasons, weather windows, and when prices dip.' },
  { title: 'Getting there', blurb: 'Nearest airports, transfers, and whether you’ll want a car.' },
  { title: 'What to budget', blurb: 'Honest all-in nightly costs — no surprise fees at checkout.' },
  { title: 'Build an itinerary', blurb: 'Save stays to a wishlist and map your days around them.' },
];

/** Themed collections that deep-link into filtered stays. */
export const COLLECTIONS: Collection[] = [
  { title: 'Slow coastal mornings', blurb: 'Wake to the water', count: 24, img: img('photo-1506905925346-21bda4d32df4') },
  { title: 'Mountain hideaways', blurb: 'Above the noise', count: 18, img: img('photo-1488462237308-ecaa28b729d7') },
  { title: 'Design-led stays', blurb: 'Homes worth the trip', count: 15, img: img('photo-1568605114967-8130f3a36994') },
  { title: 'Off-grid escapes', blurb: 'Truly unplugged', count: 12, img: img('photo-1518780664697-55e3ad937233') },
];
