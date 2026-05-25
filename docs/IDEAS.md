---
doc: IDEAS
purpose: Living backlog of product ideas — captured as they're pitched, triaged for effort + dependencies. Not a commitment; a parking lot we pull from.
last_updated: 2026-05-25
---

# Ryo — Ideas backlog

How to read the tags: **Effort** S (hours) · M (a day) · L (multi-day). **Needs** = external dependency (key/auth/etc.). **Status** 💡 idea · 🔜 queued · 🏗️ building · ✅ shipped.

---

## 🏗️ In flight right now
| Idea | Notes | Status |
|---|---|---|
| **Stories tab** — travel-content hub (seasonal picks, city guides, user blogs+photos, plan-your-trip, themed collections) | synthetic content, no AI needed | 🏗️ building (me) |
| **Notifications inbox** (guest) | client-side store + `/notifications` | 🏗️ building (agent) |
| **Host payouts + KYC** UI | payout method, verification checklist | 🏗️ building (agent) |

## ✅ Shipped
- Brand overhaul (cream/terracotta/ink + Fraunces) · tactile UI · centered layout · 3 demo accounts · role-aware nav · host actions · guest reviews + named wishlists · richer trip itinerary · `/help` support→incident loop · app-wide brand-color sweep

## 🔜 Greenlit / planned (from earlier discussion)
| Idea | Effort | Needs | Status |
|---|---|---|---|
| **AI Concierge** that answers + acts | M | `ANTHROPIC_API_KEY` | built, dormant (no key) |
| Real auth (magic-link/Google) end-to-end | M | Supabase URL config + Google client + SMTP | parked |
| Admin/incidents → real Supabase backend | L | real auth | queued |
| Honest all-in pricing + Stay Guarantee surface | S–M | — | idea |

---

## 💡 Your ideas (pitch them — I'll log each here)

> Drop ideas in any form; I'll capture each with a one-line effort/feasibility read so we can decide what to pull next.

### 1. Traveler badges + score (gamified profile) — _your pitch, 2026-05-25_
**Raw idea:** reward guests with profile badges + a score based on how much they travel, the pics they upload, and the blogs they write.

**Captured + expanded (travel-blogger lens):**

- **Milestone badges** (auto from completed trips): *3+ states in a year · 5+ countries in a year · 10 cities · 50 nights · 3 continents · "Off the map"* (remote/low-density locations).
- **Persona/archetype badges** (their "X guy" — earned by where you stay most): 🏖️ **Beachcomber** · ⛰️ **Summiteer** (mountains) · 🏛️ **Historian** (heritage) · 🛕 **Pilgrim** (devotional) · 🏯 **Architecture buff** (architectural marvels) · 🌿 **Off-grid Wanderer** (remote) · 🏝️ **Island-hopper** · 🍜 **Tastemaker** (foodie) · 🐌 **Slow traveler** (long stays) · 💻 **Nomad**.
- **Contribution badges** (from the Stories feature): photos uploaded, blogs/guides written, helpful reviews, guides that got saved.
- **Ryo Score** ("Wayfarer Score") — weighted blend: trips + diversity (states/countries/remoteness) + content (photos, blogs, reviews) + helpfulness (saves/likes on your content). **Tiers:** Explorer → Voyager → Pathfinder → Legend, shown as a score ring on the profile.
- **Perks (omotenashi tie-in):** higher tiers unlock concierge perks / early access / featured stories — turns the score into a real reason to contribute.
- **Profile surface:** a badge shelf, the score ring, "this year" stats (states · countries · nights · remoteness), a been-there map, and progress nudges ("2 more countries → Globetrotter").

**Feasibility:** **v1 UI-first is very doable now** — derive states/countries/nights from the user's `bookings` (listing city/country) + count content from the wishlist/review/Stories activity; render badges + score on the profile from a client-side scoring engine (no backend). **Real version** needs persistent content counts + a scoring service. Ties directly into the Stories tab (content = score) and reviews.
**Effort:** S–M for the synthetic v1 on the profile · L for the full real system. **Needs:** none for v1. **Touches:** profile/account (coordinate with the profile lane) + a new `badges`/`score` store. **Status:** 💡 logged.

### 2. City Guide pages — history · sights · food · local gifts · emergency info — _your pitch, 2026-05-25_
**Raw idea:** per-city block with the city's history, most-visited places, famous food, must-buy local gift items, and emergency numbers.

**Captured + expanded:** a **City Guide page** (e.g. `/guide/[city]`, linked from the Stories tab + a listing's "Where you'll be") with:
- **At a glance:** best time to visit, language, currency, getting around, vibe.
- **A short history** — a warm 2–3 paragraph story of the place (editorial, Fraunces).
- **Most visited** — top sights with a one-line "why go" + photo.
- **Famous food** — signature dishes + where locals eat them.
- **Bring it home** — local crafts / specialties worth buying as gifts (e.g. Kyoto matcha & yatsuhashi, Lisbon cork & tiles).
- **Festivals / what's on** — seasonal events (ties into "good right now").
- **🆘 Safety panel** — country emergency numbers (police / ambulance / fire / tourist helpline), nearest hospital, embassy note, + the Ryo 24/7 concierge. Builds trust — omotenashi + Trust & Safety (`docs/11`).

**Feasibility:** static curated content per city (no backend), same pattern as the Stories tab — start with the ~6 seed cities we already have listings for. Emergency numbers = a small static country→numbers table. Links naturally from listing detail + Stories.
**Effort:** M (city-guide template + curate ~6 cities) · ongoing to add more cities. **Needs:** none. **Touches:** new `features/src/guide/*` + a `/guide/[city]` route + a static content/data module. **Status:** 💡 logged. **Pairs with:** the Stories tab (city guides section can deep-link here).

### 3. Travel Groups — community trip-planning (FUTURE) — _your pitch, 2026-05-25_
**Raw idea:** let people start a group to plan a trip and post it so others can join and "jam" together. To start a group you must be a member for 1+ year **or** have our authorization (trust gate, anti-spam).

**Captured + expanded:** **Trip Circles** — a user opens a group around a destination/theme/dates, posts the draft plan/itinerary, others browse + request to join, and members coordinate on a shared board (dates, wishlist voting, split planning, group chat).
- **Trust gate to *create*:** ≥1-year account **or** Ryo-approved — and could also require a **Wayfarer tier** (ties into idea #1 badges/score: e.g. "Pathfinder+ can host Circles"). Keeps it scam-free.
- **Moderation:** report/leave a group, host can remove members, admin oversight (ties into `/admin` incidents).
- **Discovery:** open Circles surface in the Stories/Explore tab ("Going to Bali in July? 3 Circles open").

**Feasibility:** this is a real **social feature** — the 1-year gate needs real account-age data, and posts/membership/chat need a real backend + moderation. So genuinely **future / post-launch**; a synthetic UI mockup is possible sooner but the trust gate isn't real without auth.
**Effort:** **L** (large). **Needs:** real auth (account age) + a groups/posts backend + moderation. **Touches:** new groups feature + api + admin moderation. **Status:** 🔮 future. **Pairs with:** badges/score (tier-gated hosting) + Stories (discovery) + admin (moderation).
