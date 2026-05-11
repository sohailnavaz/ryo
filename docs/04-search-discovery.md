# 04 · Search & Discovery

> How a guest finds the right Ryo stay — fast, calm, personalised, globally aware.

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Module ID     | `04-search-discovery`                                                                    |
| Status        | ✏️ Draft                                                                                 |
| v1 scope      | Full (search, filters, map, basic personalisation).                                      |
| Owner         | TBD                                                                                      |
| Linked        | [03 listings](./03-listings.md), [05 bookings](./05-bookings.md), [10 i18n](./10-i18n-localization.md) |
| Last updated  | 2026-04-23                                                                               |

---

## 1. Purpose & Ryo alignment

The search experience is where Ryo wins or loses a guest. It must be **fast** (sub-200ms first result), **calm** (no dark patterns, no urgency manipulation, no drip-reveal of fees), and **honest** (final price shown up-front). This is where [branding §3.3](./branding.md#33-differentiators-the-better-than-airbnb-axes-) #5 (calm, trustworthy UI) is most visible.

---

## 2. User stories

### Guest
- As a guest, I want to search by destination and dates with the fewest possible required fields.
- As a guest, I want to see the **total price** (including all fees) inline on every search result.
- As a guest, I want filters that match how I actually think (budget, beds, type, instant-book, verified-host-only).
- As a guest, I want a map that is useful on both desktop and mobile, with clustering for dense areas.
- As a guest, I want my currency and language to just work without configuration.
- As a guest, I want smart defaults — recent searches, saved preferences.

### Host
- As a host, I want my listing to rank fairly and transparently.

### Internal
- As ops, I want to tune ranking weights without a code deploy.

---

## 3. Core flows

### 3.1 Primary search
1. Input: destination (text, ~geo-suggested), check-in, check-out, guests.
2. System geocodes destination → bounding box (city / neighbourhood / specific area).
3. Query runs against the listing index with filters.
4. Result set returned with pagination (20 per page, cursor-based).

### 3.2 Filters
All filters compose with AND semantics across groups.

| Group        | Options                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| **Price**    | Slider; currency-aware; shows total-price distribution histogram                  |
| **Type**     | Entire place / Private room / Shared room                                         |
| **Beds**     | Bedrooms, beds, bathrooms                                                         |
| **Amenities**| Wi-Fi, AC, kitchen, workspace, pool, parking, pet-friendly, accessibility         |
| **Booking**  | Instant book only                                                                 |
| **Trust**    | Verified host only · Boutique tier only                                           |
| **Stay rules**| Pet-friendly, events-allowed, long-stay-friendly                                 |
| **Accessibility**| Step-free entry, wide doorways, accessible bathroom, etc.                     |

### 3.3 Sort options
- **Recommended** (default; see §4 ranking).
- **Price: low → high** (total, not nightly).
- **Price: high → low**.
- **Top-rated**.
- **Newest**.

### 3.4 Map view
- Cluster pins at zoom levels where density > threshold.
- Hovering a result card highlights the pin; clicking a pin opens a mini-card.
- "Search as I move the map" toggle — off by default (calm > jumpy).
- Obscured polygon shown at city level; exact coordinates never exposed publicly.

### 3.5 Personalization (lightweight v1)
- Recent searches (last 5).
- Favourites ("saved").
- Viewed-recently row.
- No aggressive recommendation algorithms in v1 — the curation bar does the heavy lifting.

### 3.6 Empty / zero-result states
- Explain **why** zero results (dates unavailable vs. filters too narrow vs. destination unknown).
- Offer one-tap loosening: nearby dates, nearby areas, relax-filters.

---

## 4. Ranking

Ranking is a deterministic score `S` with tunable weights. No ML in v1.

```
S = w1 · tier_score
  + w2 · rating_score
  + w3 · review_count_score
  + w4 · response_rate_score
  + w5 · recency_score
  + w6 · price_fit_score
  + w7 · photo_quality_score
  − w8 · cancellation_penalty
```

- `tier_score`: Boutique > Standard.
- `price_fit_score`: distance from median for the area at chosen filter settings (outliers both ways de-ranked).
- Weights live in `ranking_config` table; admin can tune without deploy.
- Host paid-placement is **disabled** in v1 (and possibly forever) — the no-dark-patterns promise.

---

## 5. Data model & index

Search is served by a **read-optimised denormalised view** of `listings` + indexed tables:

### `public.listings_search_index` (materialised view, refreshed on listing write)
Includes: `listing_id`, `tier`, `city`, `country`, `geopoint`, `guests_max`, `amenities[]`, `rating_avg`, `rating_count`, `base_price_minor`, `currency`, `instant_book`, `response_rate`, `last_booked_at`, text search vector.

### Postgres tooling
- `tsvector` for full-text on title + description.
- `PostGIS` geography for radius + bounding-box queries.
- GIN indexes on `amenities[]`.
- Eventually (v3+): Meilisearch or Typesense for richer relevance. Not v1.

### `public.saved_searches`
Per-user saved queries → become alerts later.

### `public.favorites`
`user_id + listing_id → added_at`.

---

## 6. API surface

- `GET /search?q=&dates=&guests=&filters=&sort=&cursor=` — returns listings + facet counts.
- `GET /search/suggest?q=` — destination autocomplete (cities, neighbourhoods, POIs).
- `POST /favorites/toggle`.
- `GET /favorites`.
- `GET /search/recent`.

Response shape (search hit) — key fields:
```
{
  id, title, hero_photo, city,
  tier, rating_avg, review_count,
  total_price_minor, currency,  // total for user's requested dates & party
  instant_book, is_favorite,
  location_preview: { poly: [...], city: "Goa" }
}
```

---

## 7. Edge cases & failure modes

- **No dates provided.** Search still runs; prices shown as "from" with a hint to enter dates for exact total.
- **Destination unknown / ambiguous.** Autocomplete must disambiguate; fall back to text-match on listing city/country.
- **Currency mismatch.** All prices converted to user's preferred currency at the **display layer**, while the booking charge is confirmed in the host's currency with a pinned FX quote at checkout.
- **Very few results.** Suggest "show results nearby" expansion.
- **Filter combinations that return 0.** Show a loosening CTA.
- **Map on slow networks.** Lazy-load the map; show list first; map on tap.
- **Search abuse / scraping.** Rate-limit anonymous queries; full results for signed-in users.
- **RTL languages.** Entire layout mirrors; price-range slider and map orientation must respect direction.

---

## 8. KPIs

- **Search → listing click-through rate**.
- **Listing → booking-start rate**.
- **Zero-result rate** (should trend down as supply grows).
- **P95 search latency** (target < 250ms at edge).
- **Map interaction rate** (map users are higher-intent).
- **Saved-search → return-session rate**.

---

## 9. Dependencies

- [03 listings](./03-listings.md) — index source.
- [06 payments](./06-payments-payouts.md) — FX for display totals.
- [10 i18n-localization](./10-i18n-localization.md) — currency, number, date.
- **Mapping**: MapLibre GL (web) + react-native-maps (native) — same tile vendor (Mapbox tiles or MapTiler).
- **Geocoding**: same vendor.

---

## 10. v1 scope

- ✅ Text search + dates + guests.
- ✅ Filters (price, type, beds, amenities, instant-book).
- ✅ Sort (recommended, price, rating, newest).
- ✅ Map view with clustering.
- ✅ Favourites.
- ✅ Saved searches (without alerts yet).
- 🔲 Saved-search alerts — v2.
- 🔲 Personalised recommendation row — v2.

---

## 11. Open questions

- 🔲 Default map provider — Mapbox vs. MapTiler vs. self-hosted OSM.
- 🔲 Handle the "I don't know where to go" entry state — curated collections? A "surprise me" button?
- 🔲 How aggressive should "nearby dates" suggestions be when exact dates show zero?
- 🔲 Do we show the map on mobile by default, or list-first with map toggle?
