# 03 · Listings

> Every Ryo stay begins as a listing. This module defines how listings are created, curated, and priced.

| Field         | Value                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Module ID     | `03-listings`                                                                                   |
| Status        | ✏️ Draft                                                                                        |
| v1 scope      | Read-only browsing of seeded listings. Creation/editing is v2.                                  |
| Owner         | TBD                                                                                             |
| Linked        | [02 auth](./02-auth-identity.md), [04 search](./04-search-discovery.md), [05 bookings](./05-bookings.md), [13 host-tools](./13-host-tools.md) |
| Last updated  | 2026-04-23                                                                                      |

---

## 1. Purpose & Ryo alignment

Curation is a brand differentiator — we surface fewer, better listings rather than everything. Every listing passes a quality bar before it is publicly bookable. Ties directly to [branding §3.3](./branding.md#33-differentiators-the-better-than-airbnb-axes-) #4 (curation).

---

## 2. User stories

### Guest
- As a guest, I want honest photographs and descriptions so I can trust what I am booking.
- As a guest, I want to see a clear total price up-front — no surprise fees.
- As a guest, I want to know what is verified about this listing (host identity, on-site inspection, past reviews).

### Host
- As a host, I want a guided listing flow that takes <30 minutes for a simple property.
- As a host, I want feedback on how to improve my listing (photos, description, pricing).
- As a host, I want to pause a listing temporarily without deleting it.

### Concierge / Moderator
- As a moderator, I want a triage queue of newly submitted listings with clear accept/reject criteria.
- As a concierge, I want to flag a listing for review without removing it.

---

## 3. Listing tiers 🔒

Every listing belongs to one tier. Tiers drive search ranking and badging.

| Tier         | Criteria                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------- |
| **Boutique** | Host fully KYC'd, on-site inspection passed, ≥10 photographs meeting standard, ≥4.8★ over 10+ reviews, response rate ≥95%, no cancellations by host in 12 months. |
| **Standard** | Host KYC'd, ≥8 photographs, description ≥100 words, accurate calendar, ≥4.2★ if reviewed.           |
| **Pending**  | Submitted, awaiting moderation.                                                                     |
| **Archived** | Paused or delisted.                                                                                 |

Only **Boutique** and **Standard** are searchable by guests.

---

## 4. Core flows

### 4.1 Listing creation (host-initiated, v2)
1. Host starts a new listing; system creates `listings` row in `draft` state.
2. Host completes sections (save-resume supported):
   - **Basics** — property type, room type, guests, bedrooms, bathrooms
   - **Location** — address (geocoded; obscured to ~300m on public map until booked)
   - **Photos** — min 8, max 40, auto-quality-scored
   - **Description** — title (≤60 chars), summary (≤500), space, guest access, rules
   - **Amenities** — checklist from canonical taxonomy
   - **Availability & calendar** — rules, min/max stay, prep days
   - **Pricing** — base rate, weekend rate, seasonal, length-of-stay discounts
   - **Policies** — cancellation policy choice (Flexible / Moderate / Strict)
3. Host submits → listing enters `pending` state → moderation queue.
4. Moderator decisions:
   - `approve` → listing becomes searchable at appropriate tier.
   - `request_changes` → listing returns to draft with itemised notes.
   - `reject` → listing archived with reason.

### 4.2 Listing editing
- Minor edits (description, photos, price) are live after auto-checks.
- Major edits (location change, capacity change) re-enter moderation.

### 4.3 Boutique tier upgrade
- Automatic eligibility check runs nightly; listings that cross the bar are offered an upgrade notification and on-site inspection scheduling.

### 4.4 Pausing / archiving
- Host can `pause` a listing; search hides it, existing bookings unaffected.
- Host can `archive` a listing; existing bookings honoured, no new bookings.

### 4.5 Photo pipeline
- Upload → virus scan → original kept in private bucket → resized derivatives (thumb / card / full / hero) generated.
- Auto-quality flags: blurry, low light, watermarked, portrait-only, duplicate.
- Host can reorder; first photo is hero.

---

## 5. Data model

### `public.listings`
| Column              | Type                   | Notes                                                  |
| ------------------- | ---------------------- | ------------------------------------------------------ |
| `id`                | `uuid PK`              |                                                        |
| `host_id`           | `uuid FK → profiles`   |                                                        |
| `state`             | `text`                 | `draft` / `pending` / `active` / `paused` / `archived` |
| `tier`              | `text`                 | `boutique` / `standard`                                |
| `property_type`     | `text`                 | Canonical taxonomy                                     |
| `room_type`         | `text`                 | `entire_place` / `private_room` / `shared_room`        |
| `title`             | `text`                 | ≤60 chars                                              |
| `summary`           | `text`                 | ≤500 chars                                             |
| `description`       | `text`                 |                                                        |
| `guests_max`        | `int`                  |                                                        |
| `bedrooms`          | `int`                  |                                                        |
| `beds`              | `int`                  |                                                        |
| `bathrooms`         | `numeric(3,1)`         |                                                        |
| `location`          | `geography(Point,4326)`| Exact geo, obscured at public API                      |
| `address_json`      | `jsonb`                | Structured address; private                            |
| `city`, `country`   | `text`                 | Public                                                 |
| `base_price_minor`  | `int`                  | Minor units (paise/cents)                              |
| `currency`          | `text`                 | ISO 4217                                               |
| `cleaning_fee_minor`| `int`                  |                                                        |
| `cancellation_policy`| `text`                | `flexible` / `moderate` / `strict`                     |
| `min_nights`        | `int`                  |                                                        |
| `max_nights`        | `int`                  |                                                        |
| `instant_book`      | `boolean`              |                                                        |
| `published_at`      | `timestamptz`          |                                                        |
| `created_at`        | `timestamptz`          |                                                        |
| `updated_at`        | `timestamptz`          |                                                        |

### `public.listing_photos`
| Column       | Type          | Notes                                        |
| ------------ | ------------- | -------------------------------------------- |
| `id`         | `uuid`        |                                              |
| `listing_id` | `uuid FK`     |                                              |
| `position`   | `int`         | Order; 0 = hero                              |
| `storage_key`| `text`        | Original                                     |
| `alt_text`   | `text`        | Host-provided + AI-suggested                 |
| `quality_score` | `numeric`  | 0–1                                          |

### `public.listing_amenities`
Join table to canonical `amenities` table (wifi, ac, kitchen, pool, …).

### `public.listing_rules`
Structured rules: no-smoking, no-pets, events-allowed, quiet-hours, check-in-window.

### `public.calendar_days`
| `listing_id` + `date` | `status` (`available` / `blocked` / `booked`) | `price_override_minor` |

### `public.pricing_rules`
Seasonal windows, weekend premiums, length-of-stay discounts.

---

## 6. API surface

- `listings.list(filters, cursor)` — public search (see [§04 search](./04-search-discovery.md)).
- `listings.get(id)` — public detail view.
- `listings.availability(id, from, to)` — returns available days + total price quote.
- `listings.save_draft`, `listings.submit`, `listings.update`, `listings.pause`, `listings.archive` — host.
- `listings.moderate(id, decision, notes)` — moderator.
- `listings.upload_photo`, `listings.reorder_photos`, `listings.delete_photo`.
- `listings.price_preview(id, from, to, guests)` — server-computed total including fees, tax, currency conversion.

All prices returned by the API are **already inclusive** of all Ryo-controllable fees. Total = `nightly × nights + cleaning + service_fee + tax`.

---

## 7. Edge cases & failure modes

- **Listing with zero photos.** Cannot submit.
- **Exact address leakage.** Public API must not expose precise coordinates; we return an obscured polygon centroid within ~300m. Exact address revealed only after booking is confirmed.
- **Duplicate listings by same host at same address.** Detected and merged during moderation.
- **Stale calendar.** Host must sync or confirm availability every 30 days; stale calendars are down-ranked.
- **Photo copyright abuse.** Reverse image search; removal + host warning.
- **Moderator backlog.** SLA: new listing decisions within 48 hours; expose this SLA to hosts.
- **Price sanity.** Detect outlier pricing vs neighbourhood; warn host before publish.

---

## 8. KPIs

- **Time to first published listing** (host signup → live).
- **Listing approval rate** at first submission (higher = clearer flow).
- **Boutique share** of total active listings.
- **Photo quality score** distribution.
- **Listing-to-booking conversion** by tier.
- **Host response time** (separate but surfaced on listing).

---

## 9. Dependencies

- [02 auth](./02-auth-identity.md) — host role + KYC status.
- [04 search](./04-search-discovery.md) — indexing.
- [05 bookings](./05-bookings.md) — calendar locks.
- [11 trust-safety](./11-trust-safety.md) — listing moderation rules.
- **Storage**: Supabase Storage (photos) with CDN.
- **Geocoding**: Mapbox or Google Geocoding (TBD).
- **Image processing**: sharp / Cloudinary (TBD).

---

## 10. v1 scope

- ✅ Seeded listings in DB (script + sample assets).
- ✅ Listing detail view (photos, description, price preview, availability).
- 🔲 Host-initiated creation — **v2**.
- 🔲 Moderation queue — **v2**.
- 🔲 Boutique tier logic — **v2**.

---

## 11. Open questions

- 🔲 Canonical amenity taxonomy v1 — adopt Airbnb's, or derive our own?
- 🔲 On-site inspection process for Boutique — staff, contractor, or partner?
- 🔲 Short-term-let legality varies by city (Barcelona, NYC…) — detect and warn at list-time.
- 🔲 Should hosts be able to set their own per-guest service-fee cap? (Default: no.)
- 🔲 Photo watermarking policy — allow small host watermark, or prohibit?
