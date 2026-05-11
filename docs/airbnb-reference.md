# Airbnb — Product & Domain Reference (for Ryo v1)

> A working teardown of how Airbnb actually functions, scoped to what Ryo is rebuilding in v1.
> This is a **reference**, not a spec. Ryo is not a clone — see [§6 What Ryo does differently](#6-what-ryo-does-differently) and `docs/branding.md` §3.3.

Last updated: 2026-04-23 · Doc version: `0.1.0` · Scope: **guest-only v1**

---

## Table of Contents

- [0. How to use this doc](#0-how-to-use-this-doc)
- [1. Product surfaces (the guest journey)](#1-product-surfaces-the-guest-journey)
  - [1.1 Home / Explore](#11-home--explore)
  - [1.2 Search](#12-search)
  - [1.3 Listing detail](#13-listing-detail)
  - [1.4 Booking flow](#14-booking-flow)
  - [1.5 Trips](#15-trips)
  - [1.6 Profile](#16-profile)
  - [1.7 Wishlists / Favorites](#17-wishlists--favorites)
- [2. Cross-cutting mechanics](#2-cross-cutting-mechanics)
- [3. Domain model](#3-domain-model)
- [4. Pricing breakdown](#4-pricing-breakdown)
- [5. Trust, safety & payments (what scale forced on Airbnb)](#5-trust-safety--payments-what-scale-forced-on-airbnb)
- [6. What Ryo does differently](#6-what-ryo-does-differently)
- [7. v1 scope: in / out](#7-v1-scope-in--out)
- [8. Phase → reference map](#8-phase--reference-map)
- [9. Open questions](#9-open-questions)

---

## 0. How to use this doc

- Read the section for the phase you're about to build before you start (see [§8](#8-phase--reference-map)).
- Treat each "how Airbnb does it" subsection as *prior art*, not a prescription.
- When Ryo deviates intentionally, note it under [§6](#6-what-ryo-does-differently). When the deviation is scope-driven (v1 cuts), note it in [§7](#7-v1-scope-in--out).
- This doc observes Airbnb's public product as of 2026; internals are inferred, not insider knowledge.

---

## 1. Product surfaces (the guest journey)

Airbnb's guest flow is a funnel: **Explore → Search → Listing → Book → Stay → Review**. Each surface narrows intent and commits more trust.

### 1.1 Home / Explore

**Purpose.** Pull a cold visitor into a search without making them type.

**Key elements.**
- **Category bar** (sticky, horizontally scrolling) — ~60+ icon-labelled categories ("Beachfront", "Cabins", "Amazing pools"). Tapping one issues a filtered search — no query text required.
- **Responsive grid of listing cards** — 4 cols desktop, 2 cols tablet, 1 col mobile. Infinite scroll.
- **Listing card** — photo carousel (swipeable), heart (favorite), location, distance / date range, nightly price, rating.
- **Global top bar** — logo, collapsed search pill (expands on click → multi-step search), profile / login menu.
- **Footer nav on mobile** — Explore / Wishlists / Trips / Inbox / Profile.

**Data flow.**
- Initial render: default category = "All", default region = inferred from IP, paginated (20–30 cards).
- Category tap → re-query with `category` filter, reset pagination.
- Card hover (desktop) → prefetch listing detail.

**Patterns worth copying.**
- Category bar as zero-friction discovery (no empty search box).
- Card price = **nightly rate only**, but listing detail shows **total**. Airbnb has been criticised for this; [§6](#6-what-ryo-does-differently) has Ryo's stance.

### 1.2 Search

**Purpose.** Let a guest with a concrete trip in mind (place + dates + guests) narrow the inventory.

**Input model.** Four fields, in order:
1. **Where** — destination or "I'm flexible". Autocomplete from a geocoded places index.
2. **Check-in / Check-out** — calendar (two-month view, desktop; single-month sheet, mobile). Supports "flexible dates" (±1, ±3, ±7 days).
3. **Guests** — adults / children / infants / pets steppers.
4. Optional **filters** (opened via "Filters" button, ~25 filters): price range, room type, bedrooms/beds/baths, amenities, property type, accessibility, host language, instant-book.

**Result page.**
- Split view on desktop: **map on right, list on left**. Map pins = price; hover card ↔ pin linkage.
- On mobile: list view with "Show map" toggle.
- URL-synced state (every filter in query params) — shareable, back/forward works.
- Empty states: "no results" → suggest relaxing dates or expanding radius.

**Patterns worth copying.**
- URL as state. Back/forward navigation must not re-fetch identical results.
- Map ↔ list two-way sync.
- Save-as-search (optional; post-v1).

### 1.3 Listing detail

**Purpose.** Give a guest enough confidence to book.

**Above the fold.**
- **Gallery** — hero photo + 4-tile grid; "Show all photos" opens a full-screen lightbox. ~20–50 photos.
- **Title, rating + review count, location.**
- **Sticky booking card** (right column, desktop; sticky bottom bar, mobile): dates, guests, price breakdown, "Reserve" CTA.

**Below the fold (single long scroll).**
- **Host block** — photo, "Hosted by X", Superhost badge, response rate, identity-verified badge.
- **Highlights** — 3–5 bullets (e.g., "Self check-in", "Great for remote work").
- **Description** — free text, "Show more" fold.
- **Amenities** — grid of ~10; "Show all 47 amenities" sheet.
- **Bedroom configuration** — card per bedroom with bed type.
- **Calendar** — 2-month view showing blocked vs. available dates.
- **Reviews** — overall score + 6 subscores (cleanliness, accuracy, check-in, communication, location, value), paginated reviews (5 shown, "Show all N reviews" sheet).
- **Location** — map (approximate until booked; exact pin released post-booking), neighbourhood blurb.
- **Host details** — bio, languages, response time, other listings.
- **Things to know** — house rules, safety & property, cancellation policy.

**Sticky booking card behaviour.**
- Dates unset → shows nightly price + "Check availability".
- Dates set → shows nightly × nights + cleaning fee + service fee + taxes = **total**.
- "Reserve" routes to booking flow (or instant-book → confirmation, if enabled).

### 1.4 Booking flow

**Purpose.** Convert intent into a confirmed reservation.

**Steps (Airbnb's current flow).**
1. **Review trip** — dates, guests, price breakdown, cancellation policy summary.
2. **Sign in / sign up** — if not authed.
3. **Pay with** — card / PayPal / Google Pay / Apple Pay / Klarna (region-specific).
4. **Message the host** — optional; required for request-to-book listings.
5. **Confirm and pay** — agrees to house rules, terms, cancellation policy. Single irreversible CTA.
6. **Confirmation screen** — booking code, host contact, check-in details.

**Two booking modes.**
- **Instant Book** — immediate confirmation, charge runs on submit.
- **Request to Book** — host has 24h to accept; hold on card, no charge until accepted.

**Failure modes Airbnb handles.**
- Card declined → retry with another method; dates **do not** hold.
- Host declines → auto-refund, suggest similar listings.
- Dates conflict mid-flow (rare race condition) → soft error + re-search.

**For v1 (mock payment).** Airbnb's two-mode split collapses to one: all bookings instant-confirm, "payment" is a single disabled-looking step that writes a `bookings` row with status `confirmed`. See [§6.3](#63-payments).

### 1.5 Trips

**Purpose.** One place for every reservation the guest has ever made.

**Sections.**
- **Upcoming** — check-in countdown, host contact, check-in instructions (unlocked closer to the date), "Get directions".
- **Current** — reservation in progress; prominent "Contact host" and "Contact Airbnb" CTAs.
- **Past** — history, with "Leave a review" prompt for 14 days post-stay.
- **Cancelled** — separate tab.

**Per-trip detail page.**
- Reservation code, dates, guests, total paid, receipt.
- Check-in instructions (released 48h before).
- Host contact (phone revealed 24h before).
- **Cancel or change dates** — policy-aware (flexible / moderate / strict determines refund).
- **Get help** — opens support flow.
- **Directions / Save to calendar / Share itinerary**.

### 1.6 Profile

**Purpose.** Identity surface — for the guest's own account and (publicly) for hosts who see them.

**Account side (private).**
- Personal info (name, email, phone, government ID if verified).
- Login & security (password, 2FA, connected social logins).
- Payments & payouts (cards on file, payment history).
- Notifications (email / SMS / push toggles).
- Privacy & sharing.
- Accessibility preferences.

**Public side (what hosts see).**
- Avatar, first name, location, short bio, languages, verifications (email ✓, phone ✓, ID ✓).
- Reviews *written by hosts about this guest*.
- Wishlists (only ones guest has marked public).

### 1.7 Wishlists / Favorites

**Purpose.** A low-commitment save — a heart tap, not a form.

**Behaviour.**
- Heart on any card or listing detail → prompts first time to create/choose a wishlist (Airbnb bucket-names them; just "Favorites" is fine for v1).
- Wishlists are named collections, shareable, collaborative (another user can edit with a link).
- Each wishlist has its own page: grid + map of saved listings, date/guest filters apply across the set.
- Un-hearting removes from the *current* wishlist only (multi-wishlist UX).

**For v1.** Single implicit wishlist per user. Toggle on/off. No naming, no collaboration.

---

## 2. Cross-cutting mechanics

| Mechanic              | How Airbnb does it                                                                                                   | Relevance to v1                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Auth**              | Email/password, Google, Apple, Facebook. Email + phone both required before booking.                                 | Ryo: magic link + Google (Phase 5).              |
| **I18n**              | Locale auto-detected + user-overridable. Currency independent of locale.                                             | Foundational for Ryo (§9 in branding).           |
| **Currency**          | Display in user-preferred currency; host is always paid in listing currency. FX shown with "approx".                 | v1: single currency (USD); real FX is post-v1.   |
| **Search performance**| Pre-rendered common queries (city + month combos); Elasticsearch-style index for filters; map uses tile-based pins.  | v1: Postgres full-text + PostGIS is sufficient.  |
| **Availability**      | Per-listing calendar with minimum nights, max nights, check-in/out day rules. Updated by host or iCal sync.          | v1: simple per-night `availability` table.       |
| **Reviews**           | Double-blind (guest and host submit within 14 days; both released simultaneously). Mandatory 6 subscores.            | v1: read-only seeded reviews (no writes).        |
| **Messaging**         | In-app thread per booking + free-form pre-booking inquiries.                                                         | **Out of v1.** See §7.                           |
| **Notifications**     | Push (mobile), email, SMS. Dedup across channels. Transactional vs. marketing strictly separated.                    | v1: email only; push is post-v1.                 |
| **Trust signals**     | Superhost, Plus, Luxe tiers. Verified badge. Review count. Response rate/time.                                       | Ryo inverts this — see §6.1.                     |

---

## 3. Domain model

The core entities Airbnb exposes (inferred from its public product). Ryo's `packages/db` schema should start from this.

```
User
 ├─ id, email, phone, created_at
 ├─ profile: first_name, avatar_url, bio, languages, location
 └─ verifications: email_verified_at, phone_verified_at, id_verified_at

Host  (one-to-one with User in Airbnb; separate record)
 └─ superhost, response_rate, response_time_hours, payout_method

Listing
 ├─ id, host_id, title, description, property_type, room_type
 ├─ location: country, region, city, lat, lng, approximate_lat, approximate_lng
 ├─ capacity: max_guests, bedrooms, beds, bathrooms
 ├─ pricing: base_price_per_night, cleaning_fee, weekly_discount_pct, monthly_discount_pct
 ├─ rules: min_nights, max_nights, check_in_time, check_out_time, instant_book
 ├─ amenities: [amenity_id]
 ├─ photos: [{ url, caption, order }]
 ├─ ratings: overall, cleanliness, accuracy, checkin, communication, location, value, review_count
 └─ cancellation_policy: flexible | moderate | strict

Availability
 ├─ listing_id, date, available (bool), price_override (nullable)
 └─ (partitioned by listing_id + date; one row per listing-day)

Booking
 ├─ id, guest_id, listing_id, check_in, check_out, guests
 ├─ pricing_snapshot: nights, subtotal, cleaning_fee, service_fee, taxes, total, currency
 ├─ status: pending | confirmed | cancelled | completed
 ├─ created_at, confirmed_at, cancelled_at
 └─ cancellation_policy_snapshot  (frozen at booking time)

Review
 ├─ id, booking_id, author_id, target_id (user or listing), kind: guest_to_host | host_to_guest
 ├─ overall, subscores{cleanliness,...}
 ├─ body, created_at
 └─ response: {body, created_at}  (host's reply to a guest review)

Favorite  (v1 single-wishlist form)
 └─ user_id, listing_id, created_at

Wishlist  (post-v1)
 ├─ id, owner_id, name, is_public
 └─ items: [listing_id]
```

**Snapshots matter.** `pricing_snapshot` and `cancellation_policy_snapshot` on `Booking` freeze the terms at purchase time — price drops or policy changes on the listing must not retroactively alter a confirmed booking. This is the single most common mistake in clone implementations.

**Approximate vs. exact location.** Airbnb shows a ~500m-radius circle on the map pre-booking and the exact pin post-booking. The DB stores both; API gates the exact value by booking status.

---

## 4. Pricing breakdown

Every booking total decomposes into the same parts. Ryo shows all of them up-front (see [§6.2](#62-honest-pricing)).

```
nights               = check_out - check_in
subtotal             = sum over nights of (base_price_per_night or price_override)
weekly_discount      = -subtotal × weekly_discount_pct  (if nights ≥ 7)
monthly_discount     = -subtotal × monthly_discount_pct (if nights ≥ 28)
cleaning_fee         = listing.cleaning_fee             (flat per booking)
service_fee          = (subtotal − discounts) × service_fee_pct   (~14% guest-side on Airbnb)
occupancy_tax        = jurisdiction-specific; often % of subtotal
────────────────────────────────────────────────────────────────────
total                = subtotal − discounts + cleaning + service + tax
```

**v1 simplification.** Drop service fee (Ryo doesn't charge one in v1), drop taxes (out of scope). Minimal breakdown: `subtotal + cleaning_fee = total`.

---

## 5. Trust, safety & payments (what scale forced on Airbnb)

These exist because Airbnb learned the hard way. Ryo inherits the lesson, not necessarily the implementation.

**Identity verification.** Government ID + selfie match before first booking (in most markets). ID data encrypted at rest, accessed only by trust & safety agents.

**AirCover.** Guest-side protection: re-book guarantee, refund for major misrepresentations, 24/7 safety line. Host-side: property damage protection up to $3M, liability insurance up to $1M.

**Payment flow.**
- Guest pays Airbnb on booking (held in escrow).
- Host is paid **24h after check-in** — the hold period is the guest's dispute window.
- Cancellation refunds are policy-driven (flexible / moderate / strict / super-strict-60).
- Service fees are non-refundable in most policies; full-refund windows reverse this.

**Dispute resolution.** Tiered. Guest-host direct first → Airbnb mediation → case manager → legal. Most cases resolve in tier 1 or 2; Airbnb absorbs goodwill refunds to avoid escalation.

**Anti-party tech.** ML on booking patterns (one-night local booking + young guest + high guest count) to flag or block party risk. Post-2020 response to real incidents.

**For v1.** None of this exists. Payments are mocked (see invariants in `AGENTS_TODO.md`). The domain model should leave room for it (see `Booking.status` lifecycle).

---

## 6. What Ryo does differently

Ryo is not an Airbnb clone. `docs/branding.md` §3.3 names five differentiators; here is how they land in product terms.

### 6.1 Curation inverts the trust stack

Airbnb: anyone can list; guest evaluates trust signals (Superhost, reviews, verified badge) per listing.
Ryo: every host is pre-vetted before they can list. The guest never evaluates host trust — the platform already did. UI consequence: no Superhost badge, no host-level trust widgets. The *listing* carries the trust, not a tier.

### 6.2 Honest pricing

Airbnb: card and search show nightly rate; total appears at the bottom of listing detail. Result: sticker shock.
Ryo: **card shows total for current dates** (or a clearly-labeled nightly if no dates set). No surprise fees — cleaning and any taxes in the headline number. No service fee at all in v1.

### 6.3 Payments

Airbnb: real escrow, cards, regional methods.
Ryo v1: **mocked.** The booking row is written directly; no Stripe. `Booking.status` still moves through `pending → confirmed` so the real payment flow can slot in later without a schema change.

### 6.4 No messaging in v1

Airbnb: messaging is core — hosts and guests coordinate through threads.
Ryo v1: hosted means the *platform* takes the coordination load, not another chat thread. Concierge (24/7 multilingual) is the brand promise; v1 ships without the UI for it but the booking flow must not assume a message thread exists.

### 6.5 Calm over excitement

Airbnb: urgency cues ("Rare find!", "Likely to sell out"), red "dates are filling up" banners.
Ryo: no urgency manipulation. Scarcity is shown by the calendar itself, nothing else.

---

## 7. v1 scope: in / out

| Surface              | Airbnb has                                         | Ryo v1                                          |
| -------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Auth                 | Email+pw, Google, Apple, FB; phone required        | Magic link + Google; phone optional             |
| Explore / Home       | ✓ + categories                                      | ✓ + categories                                  |
| Search               | ✓ + ~25 filters + flexible dates                    | ✓ + core filters (price, guests, amenities)     |
| Map                  | ✓ two-way sync with list                           | ✓ two-way sync                                  |
| Listing detail       | ✓ + messaging, save to wishlist, share             | ✓ minus messaging                               |
| Booking flow         | ✓ + real payment + request-to-book mode            | ✓ mock payment, instant-book only               |
| Trips                | Upcoming / Current / Past / Cancelled              | Upcoming / Past / Cancelled                     |
| Reviews              | Read + write (double-blind)                        | **Read-only** (seeded)                          |
| Favorites            | Named wishlists, collaborative                     | Single implicit wishlist, solo                  |
| Profile              | Full account + public profile                      | Account basics; public profile post-v1          |
| Messaging            | ✓                                                  | ✗                                               |
| Host UI              | ✓ full platform                                    | ✗                                               |
| Payments             | Stripe + regional                                  | **Mocked**                                      |
| Notifications        | Push + email + SMS                                 | Email only                                      |
| Trust mechanics      | AirCover, ID verify, anti-party                    | None (out of scope for guest-browse v1)         |

---

## 8. Phase → reference map

Cross-reference from `AGENTS_TODO.md` phases. Read the linked section before starting the phase.

| Phase | Work                         | Reference sections                                              |
| ----- | ---------------------------- | --------------------------------------------------------------- |
| 4     | Supabase schema              | [§3 Domain model](#3-domain-model), [§5 snapshots](#5-trust-safety--payments-what-scale-forced-on-airbnb) |
| 5     | Auth                         | [§2 Cross-cutting mechanics](#2-cross-cutting-mechanics) (Auth row) |
| 6     | Explore / Home               | [§1.1 Home / Explore](#11-home--explore), [§6.5](#65-calm-over-excitement) |
| 7     | Search + filters             | [§1.2 Search](#12-search)                                       |
| 8     | Listing detail               | [§1.3 Listing detail](#13-listing-detail), [§4 Pricing](#4-pricing-breakdown), [§6.2](#62-honest-pricing) |
| 9     | Booking flow                 | [§1.4 Booking flow](#14-booking-flow), [§3 snapshots](#3-domain-model), [§6.3 Payments](#63-payments) |
| 10    | Trips + Profile + Favorites  | [§1.5](#15-trips), [§1.6](#16-profile), [§1.7 Wishlists](#17-wishlists--favorites) |
| 11    | Responsive polish            | All §1 subsections — critique against the behaviours documented |

---

## 9. Open questions

- **Category set.** Airbnb has ~60. Ryo's curation mandate argues for fewer (20–30). Decide before Phase 6.
- **Cancellation policy in v1.** Airbnb offers four; Ryo v1 could hard-code one (moderate) for simplicity. Confirm before Phase 9.
- **Review seeding.** If reviews are read-only in v1, do we seed realistic review text, or ship listings without reviews? Affects Phase 8 UI (empty states).
- **Availability granularity.** Per-day row vs. price-calendar-as-JSON. Per-day is query-friendly; JSON is cheaper. Decide before Phase 4.
- **Currency.** Single USD through v1, or display-only i18n with USD storage? Branding doc §9.1 wants i18n foundational.
