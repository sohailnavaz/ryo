-- Seed data for bnb — 20 listings across categories, with photos and a mock host.
-- Runs idempotently (TRUNCATE + insert) so `supabase db reset` is clean.

truncate public.favorites, public.reviews, public.bookings, public.listing_photos, public.listings restart identity cascade;

-- Mock host profile. In real use, the trigger creates profiles from auth.users.
-- Insert a fixed host id; real users have their own auth.users row.
-- We must also insert into auth.users with a random password to satisfy the FK.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'host@bnb.local',
  crypt('SeedHost!2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Mira Host"}',
  now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into public.profiles (id, full_name, avatar_url)
values ('11111111-1111-1111-1111-111111111111', 'Mira Host', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80')
on conflict (id) do update set full_name = excluded.full_name, avatar_url = excluded.avatar_url;

-- Helper: 20 listings
with new_listings as (
  insert into public.listings
    (id, host_id, title, description, price_cents, currency, property_type, bedrooms, bathrooms, max_guests, address, city, country, lat, lng, amenities, rating_avg, rating_count)
  values
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Cliffside villa with ocean view', 'Perched above the Amalfi coast, this sun-drenched villa sleeps six and has a private infinity pool.',
     42000, 'USD', 'Villa', 3, 2.5, 6, 'Via Mare 18', 'Positano', 'Italy', 40.6281, 14.4828,
     '["Beachfront","Wifi","Kitchen","Pool","Air conditioning","Waterfront","BBQ grill"]'::jsonb, 4.92, 128),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Modern cabin in the woods', 'A-frame retreat surrounded by pine and cedar. Hot tub under the stars.',
     18500, 'USD', 'Cabin', 2, 1, 4, '72 Pine Ridge Rd', 'Asheville', 'USA', 35.5951, -82.5515,
     '["Cabins","Wifi","Kitchen","Hot tub","Fireplace","Free parking"]'::jsonb, 4.88, 212),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Tiny home by the lake', 'Compact, clever, and beautifully designed, this tiny home sits right on the water.',
     9800, 'USD', 'Cottage', 1, 1, 2, '9 Lakeview Ln', 'Queenstown', 'New Zealand', -45.0312, 168.6626,
     '["Tiny homes","Wifi","Kitchen","Waterfront","Fireplace"]'::jsonb, 4.95, 87),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Treehouse with dreamy views', 'Float above the canopy in this hand-built treehouse. Every window is a painting.',
     22500, 'USD', 'Treehouse', 1, 1, 2, 'Hidden Grove', 'Costa Verde', 'Portugal', 41.5558, -8.4229,
     '["Treehouses","Amazing views","Wifi","Kitchen","Workspace"]'::jsonb, 4.97, 54),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Beachfront bungalow', 'Step off the deck into turquoise water. Three bedrooms, room for eight.',
     36500, 'USD', 'House', 3, 2, 8, '48 Palm Walk', 'Tulum', 'Mexico', 20.2114, -87.4654,
     '["Beachfront","Tropical","Wifi","Pool","Air conditioning","BBQ grill","Kitchen"]'::jsonb, 4.81, 304),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Design-forward city loft', 'Architect-owned loft in a converted warehouse. Floor-to-ceiling windows.',
     24000, 'USD', 'Apartment', 1, 1, 2, '300 Canal St', 'Berlin', 'Germany', 52.5200, 13.4050,
     '["Design","Wifi","Kitchen","Workspace","Heating","Gym"]'::jsonb, 4.86, 176),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Private island cottage', 'Your own slice of the Baltic. Bring supplies — this is proper off-grid.',
     52000, 'USD', 'Cottage', 2, 1, 4, 'Skerry 3', 'Stockholm Archipelago', 'Sweden', 59.3293, 18.0686,
     '["Islands","Amazing views","Waterfront","Kitchen"]'::jsonb, 4.99, 41),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Countryside farmhouse', 'Slow mornings, long lunches, olive groves. The Tuscan cliché, done right.',
     31000, 'USD', 'House', 4, 3, 8, 'Podere 12', 'Val d Orcia', 'Italy', 43.0766, 11.6125,
     '["Countryside","Wifi","Kitchen","Pool","Free parking","BBQ grill"]'::jsonb, 4.90, 221),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Modernist mountain mansion', 'Six bedrooms, panoramic views, private hiking trails.',
     92000, 'USD', 'Villa', 6, 5, 12, '1 Summit Dr', 'Aspen', 'USA', 39.1911, -106.8175,
     '["Mansions","Amazing views","Wifi","Hot tub","Fireplace","Gym"]'::jsonb, 4.93, 63),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Sun-washed riad', 'Central courtyard, rooftop terrace, the smell of orange blossom.',
     15500, 'USD', 'House', 3, 2, 6, 'Derb 14', 'Marrakech', 'Morocco', 31.6295, -7.9811,
     '["Design","Wifi","Pool","Kitchen","Air conditioning"]'::jsonb, 4.79, 189),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Overwater villa', 'Glass floor panels, private reef, maximum daydream.',
     78000, 'USD', 'Villa', 1, 1, 2, 'Lagoon 7', 'Maldives', 'Maldives', 3.2028, 73.2207,
     '["Tropical","Islands","Beachfront","Wifi","Kitchen","Air conditioning"]'::jsonb, 4.98, 102),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Alpine chalet', 'Ski-in, ski-out. Wood-burning stove. Sauna.',
     28000, 'USD', 'Cabin', 3, 2, 6, 'Chalet 5', 'Chamonix', 'France', 45.9237, 6.8694,
     '["Cabins","Amazing views","Wifi","Hot tub","Fireplace"]'::jsonb, 4.87, 148),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Kyoto machiya townhouse', 'Sliding shoji screens, tatami, private garden.',
     19500, 'USD', 'House', 2, 1, 4, 'Nakagyo 14', 'Kyoto', 'Japan', 35.0116, 135.7681,
     '["Design","Countryside","Wifi","Kitchen","Heating"]'::jsonb, 4.91, 96),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Desert earthship', 'Off-grid eco-home. Solar, rainwater, radical views.',
     14000, 'USD', 'House', 1, 1, 2, 'Mesa 7', 'Taos', 'USA', 36.4072, -105.5734,
     '["Amazing views","Countryside","Wifi","Kitchen"]'::jsonb, 4.82, 71),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Greek island whitewash', 'Cycladic dream — blue doors, bougainvillea, sunset from the roof.',
     21500, 'USD', 'House', 2, 1, 4, 'Chora 3', 'Paros', 'Greece', 37.0856, 25.1494,
     '["Islands","Beachfront","Wifi","Kitchen","Air conditioning"]'::jsonb, 4.88, 133),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Norwegian fjord cabin', 'Red timber walls, a dock, northern lights in winter.',
     17000, 'USD', 'Cabin', 2, 1, 4, 'Fjord 9', 'Geiranger', 'Norway', 62.1007, 7.2048,
     '["Cabins","Amazing views","Waterfront","Wifi","Fireplace"]'::jsonb, 4.94, 58),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Mid-century Palm Springs', 'Butterfly roof, palms, a pool the color of a postcard.',
     38000, 'USD', 'House', 3, 2, 6, '456 Alejo Rd', 'Palm Springs', 'USA', 33.8303, -116.5453,
     '["Design","Mansions","Pool","Wifi","Kitchen","Air conditioning"]'::jsonb, 4.85, 214),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Bali jungle villa', 'Rice paddies, gecko soundtrack, private pool.',
     16500, 'USD', 'Villa', 2, 2, 4, 'Ubud Valley', 'Ubud', 'Indonesia', -8.5069, 115.2625,
     '["Tropical","Countryside","Pool","Wifi","Kitchen"]'::jsonb, 4.92, 165),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Icelandic glass cottage', 'Sleep under the aurora. Literally, the ceiling is glass.',
     26000, 'USD', 'Cottage', 1, 1, 2, 'Ring Rd 1', 'Vík í Mýrdal', 'Iceland', 63.4194, -19.0063,
     '["Amazing views","Countryside","Wifi","Hot tub","Heating"]'::jsonb, 4.96, 89),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'Barcelona modernista flat', 'Gaudí-adjacent, balcony over the rambla, espresso machine we love.',
     13500, 'USD', 'Apartment', 1, 1, 2, 'Gracia 22', 'Barcelona', 'Spain', 41.3851, 2.1734,
     '["Design","Wifi","Kitchen","Air conditioning"]'::jsonb, 4.78, 251)
  returning id, city
),
photos (city, url, pos) as (
  values
    ('Positano', 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&q=80', 0),
    ('Positano', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80', 1),
    ('Positano', 'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1200&q=80', 2),
    ('Positano', 'https://images.unsplash.com/photo-1549388604-817d15aa0110?w=1200&q=80', 3),
    ('Positano', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&q=80', 4),

    ('Asheville', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80', 0),
    ('Asheville', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80', 1),
    ('Asheville', 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200&q=80', 2),
    ('Asheville', 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=80', 3),

    ('Queenstown', 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1200&q=80', 0),
    ('Queenstown', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80', 1),
    ('Queenstown', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 2),

    ('Costa Verde', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80', 0),
    ('Costa Verde', 'https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&q=80', 1),
    ('Costa Verde', 'https://images.unsplash.com/photo-1481026469463-66327c86e544?w=1200&q=80', 2),

    ('Tulum', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 0),
    ('Tulum', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&q=80', 1),
    ('Tulum', 'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=1200&q=80', 2),
    ('Tulum', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 3),

    ('Berlin', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80', 0),
    ('Berlin', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80', 1),
    ('Berlin', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80', 2),

    ('Stockholm Archipelago', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 0),
    ('Stockholm Archipelago', 'https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&q=80', 1),
    ('Stockholm Archipelago', 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=1200&q=80', 2),

    ('Val d Orcia', 'https://images.unsplash.com/photo-1464823063530-08f10ed1a2dd?w=1200&q=80', 0),
    ('Val d Orcia', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80', 1),
    ('Val d Orcia', 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=1200&q=80', 2),

    ('Aspen', 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80', 0),
    ('Aspen', 'https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?w=1200&q=80', 1),
    ('Aspen', 'https://images.unsplash.com/photo-1506755855567-92ff770e8d00?w=1200&q=80', 2),

    ('Marrakech', 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=80', 0),
    ('Marrakech', 'https://images.unsplash.com/photo-1553603227-2358aabe821e?w=1200&q=80', 1),
    ('Marrakech', 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=1200&q=80', 2),

    ('Maldives', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80', 0),
    ('Maldives', 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80', 1),
    ('Maldives', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80', 2),

    ('Chamonix', 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=80', 0),
    ('Chamonix', 'https://images.unsplash.com/photo-1548777123-e216912df7d8?w=1200&q=80', 1),
    ('Chamonix', 'https://images.unsplash.com/photo-1486162928267-e6274cb3106f?w=1200&q=80', 2),

    ('Kyoto', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80', 0),
    ('Kyoto', 'https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=1200&q=80', 1),
    ('Kyoto', 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1200&q=80', 2),

    ('Taos', 'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=1200&q=80', 0),
    ('Taos', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80', 1),
    ('Taos', 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=1200&q=80', 2),

    ('Paros', 'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1200&q=80', 0),
    ('Paros', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80', 1),
    ('Paros', 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&q=80', 2),

    ('Geiranger', 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=1200&q=80', 0),
    ('Geiranger', 'https://images.unsplash.com/photo-1508264165352-258db2ebd59b?w=1200&q=80', 1),
    ('Geiranger', 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200&q=80', 2),

    ('Palm Springs', 'https://images.unsplash.com/photo-1506485338023-6ce5f36692df?w=1200&q=80', 0),
    ('Palm Springs', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80', 1),
    ('Palm Springs', 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&q=80', 2),

    ('Ubud', 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1200&q=80', 0),
    ('Ubud', 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1200&q=80', 1),
    ('Ubud', 'https://images.unsplash.com/photo-1518544866330-95a2bec01e27?w=1200&q=80', 2),

    ('Vík í Mýrdal', 'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=1200&q=80', 0),
    ('Vík í Mýrdal', 'https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=1200&q=80', 1),
    ('Vík í Mýrdal', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 2),

    ('Barcelona', 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&q=80', 0),
    ('Barcelona', 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=1200&q=80', 1),
    ('Barcelona', 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=1200&q=80', 2)
)
insert into public.listing_photos (listing_id, url, position)
select nl.id, p.url, p.pos
from photos p
join new_listings nl on nl.city = p.city;

-- A handful of reviews spread across listings
insert into public.reviews (listing_id, guest_id, rating, body)
select l.id, '11111111-1111-1111-1111-111111111111', 5,
       'Incredible stay — the host was wonderful and the place was exactly like the photos.'
from public.listings l
order by l.created_at
limit 10;

-- Refresh rating_avg / rating_count from the review rows
update public.listings l
set rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews r where r.listing_id = l.id), l.rating_avg),
    rating_count = l.rating_count + coalesce((select count(*) from public.reviews r where r.listing_id = l.id), 0);
