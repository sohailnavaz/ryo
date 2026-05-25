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

### 4. Map-based discovery — world map + location search → nearby homes + place info — _your pitch, 2026-05-25_
**Raw idea:** a world map with city-wise selection + a search bar; the user types or drops a pin on where they're going, and we show the homes we have near it plus info about the place (ties into the Stories tab).

**Captured + expanded:**
- **Interactive map** (pan/zoom): city pins / clusters showing listing counts; click a pin → that city's homes.
- **Search + pin:** an autocomplete search ("type a city") **or** drop a pin on the map; we snap to it and surface listings within a radius.
- **Nearby homes panel:** filtered listings near the selected point (we already store `lat`/`lng` on every listing → proximity filter is client-side).
- **"About this place" panel:** short blurb + deep-link into the **City Guide** (idea #2) and **Stories** for that city.
- **Map-first mode** on the home/explore page (a list ⇄ map toggle — Airbnb-style, but Ryo commits to one default).

**Feasibility:** the `Map` primitive already exists (`packages/ui/src/Map.web.tsx` MapLibre / native) and listings have coordinates — so **city-wise pins + click→nearby homes is buildable now, no key**. **Free-text geocoding** (type any place → coords) needs a geocoding/tiles key (Mapbox/Nominatim); city-wise selection from our known cities needs none.
**Effort:** **M** (city pins + nearby-homes + place panel) · **L** with full free-text geocoding + clustering. **Needs:** none for city-wise v1; a map/geocoding key for free-text search. **Touches:** `Map` primitive + search/home + a new map-discovery screen/route. **Status:** 💡 logged. **Pairs with:** City Guides (#2) + Stories + search.

---

## ⭐ MAIN-FEATURE cluster: Travel resilience (low-bandwidth, offline, multilingual) — _your pitch, 2026-05-25_
> "Travelers may have slow internet — keep it from lagging/loading; build offline stay details + emergency numbers + help, a local-language translator, and a multi-language page (change all text to the selected language)." Flagged **build as main feature**.

### 5. Performance / low-bandwidth — keep it fast on slow connections
- **Quick wins (some now):** right-size images (request `w=` to the displayed size, not 1200 everywhere), lazy-load off-screen images, code-split heavy routes, shrink first-load JS (~367 kB), prefetch on hover.
- **Bigger:** `next/image` + Supabase Storage CDN pipeline (TODO M17), blur-up placeholders, route-level skeletons (we have Skeleton already).
- **Effort:** S (image sizing — doing now) → M (lazy/code-split) → L (full image pipeline). **Needs:** none for quick wins.

### 6. Offline stay pack — booking details + emergency numbers + help, no signal
- A **PWA** (service worker + manifest) so the app shell loads offline; cache the user's **upcoming trip** (address, check-in, host contact, receipt), **country emergency numbers**, and **help/FAQ** to IndexedDB/localStorage → an "Available offline" trip view. Add-to-home-screen.
- **Effort:** M–L. **Needs:** service worker + offline store. **Pairs with:** City Guides emergency table (#2), trip itinerary, `/help`.

### 7. Multi-language i18n — change all UI text to a selected language
- `next-intl` (web) + `expo-localization` (mobile) + locale catalogues; extract every string to ICU keys; a locale picker (footer/account); RTL plumbing. (This is TODO **M13**.)
- **Effort:** L (~5 days). **Needs:** none (string extraction is the work). Start langs: en-IN / en-US / hi-IN, then expand.

### 8. Local-language translator / phrasebook
- A **travel phrasebook** per destination (static common phrases + pronunciation) — no key, ships offline (pairs with #6). Optional **live translation** of guides/messages via a translation API (needs a key).
- **Effort:** S–M (static phrasebook) · M+ (live translation). **Needs:** none for phrasebook; API key for live.

**Sequencing note:** #5 image sizing is a fast win (starting now). #7 i18n is the backbone for #8's UI translation and is the biggest lift. #6 offline pack is high-value and self-contained. Good candidates to parallelize across agents once we commit.

### 9. Social layer — follow, like, comment + public/private profiles (FUTURE) — _your pitch, 2026-05-25_
**Raw idea:** customers can **follow** each other, **like & comment** on the posts/images people share, and keep a **private profile** (only followers see their posts) — while **public** posts are visible to everyone. Snapchat/Instagram-style.

**Captured + expanded:**
- **Social graph:** follow / unfollow, follower & following counts, follow-requests for private accounts.
- **Posts & media:** users post travel photos + notes; **likes + comments** (with their own report/moderation path → admin incidents).
- **Privacy model:** **public** profile (anyone sees public posts) vs **private** (posts visible only to approved followers) — per-post visibility toggle too.
- **Discovery feed:** public posts surface in the **Stories tab** (turns today's *synthetic* traveler-stories feed into a *real* user feed) and on traveler profiles.
- **Moderation:** report post/comment → `/admin` queue; block/mute.

**Feasibility:** a real **social network slice** — needs real auth, a backend (posts / follows / likes / comments tables + RLS enforcing the public/private rules), **media upload** (Supabase Storage), notifications, and moderation. So **future / post-launch**; a synthetic UI is possible sooner but privacy/follows aren't real without auth + RLS.
**Effort:** **XL.** **Needs:** real auth + social backend + Storage + moderation. **Status:** 🔮 future. **Pairs with:** badges/score (#1, content = score + follower milestones), Stories (#discovery feed), Travel Groups (#3), notifications (already built).

### 10. Trust & Safety — reporting, community guidelines, block & ban — _your pitch, 2026-05-25_
**Raw idea:** anyone can report someone — host→user, user→host, user→follower; we need **community guidelines**, plus **block** (user) and **ban** (admin) features.

**Captured + expanded** (aligns with `docs/11-trust-safety.md` + `docs/14-admin-ops.md`):
- **Report flows everywhere:** report a listing / user / host / review / post / comment, with reason codes + optional detail → lands in the **admin moderation/incident queue** (the `/admin` console + `/help` loop already model this).
- **Community Guidelines** — a clear public content page (the rules + what gets you removed). **Buildable now (static, no backend).**
- **Block / Mute (user-level):** I don't see or interact with X (pairs with the social layer #9).
- **Suspend / Ban (admin-level):** the admin console already has client-side "suspend user" + reason-code + audit — real ban needs backend + staff auth to persist + actually block sign-in.
- **In-stay SOS** (already noted under brand/T&S) fits here.

**Feasibility:** the **report UI + Community Guidelines page are buildable now** (reports → the existing client-side incident store, like `/help`). Real **block/ban persistence** + enforced sign-in blocking needs the backend + staff auth.
**Effort:** S (guidelines page) · M (report flows on synthetic) · L (real block/ban + enforcement). **Needs:** none for guidelines/report-UI; real auth+backend for enforcement. **Status:** 💡 logged (guidelines page = quick win). **Pairs with:** admin (#moderation), social (#9), `/help` incidents.

### 11. Location context on search — live weather + what's-on (festivals/events) — _your pitch, 2026-05-25_
**Raw idea:** when a customer searches a location, show the **current situation** — weather, and any famous thing (festival/celebration) happening there around then.

**Captured + expanded:** a **destination context panel** (on search results / a city pin / the City Guide / listing detail) showing:
- **Weather** — current + a short forecast for the trip dates.
- **What's on** — notable festivals/events/celebrations near the dates ("Día de los Muertos · Nov 1–2", "cherry-blossom season").
- A "best time to visit" nudge — feeds the Stories tab's "good right now" too.

**Feasibility:** **weather needs an API key** (OpenWeather / Open-Meteo — Open-Meteo is free/no-key!). **Events/festivals**: a **curated static calendar per city/season works now (no key)**; live events need an events API/key. So a solid v1 = Open-Meteo weather (free) + a curated festivals table.
**Effort:** M. **Needs:** none if using Open-Meteo (keyless) + curated events; a key for richer event data. **Status:** 💡 logged. **Pairs with:** City Guides (#2 "what's on"), Map discovery (#4), Stories "good right now" (#5 seasonal).

### 12. Stories page redesign — less "blog", more abstract/immersive + intro banner — _your pitch, 2026-05-25_
**Raw idea:** the Stories page feels like blogs — not interesting for the current generation. Make it more **abstract/modern**; on entering the page show a **banner describing it, then continue** into the content.

**Captured + expanded:** rework Stories from a tidy article grid into something more **editorial/immersive** (gen-Z-leaning):
- **Intro banner / cover** on entry — a bold full-bleed hero (big Fraunces statement + image/gradient/grain) that "describes the page", with a **Continue / Enter** action that scrolls into the feed.
- **More abstract layout:** asymmetric / masonry collage, overlapping cards, scroll-reveal motion, big imagery, snappy "reels-style" vertical story cards, bold type — vs. the current uniform grid.
- Keep it on-brand (warm, Fraunces) but **higher energy**.

**Feasibility:** pure UI/design pass on the existing Stories tab (synthetic content already there) — buildable now with the `frontend-design` skill. **Effort:** M. **Needs:** none. **Status:** 💡 logged (design pass). **Note:** this is a redesign of feature #Stories (already live).

### 13. Booking → calendar / reminder (client + host) — _your pitch, 2026-05-25_
**Raw idea:** a confirmed booking should drop into **Google Calendar / a reminder** automatically, for both the guest and the host.

**Captured + expanded:**
- **v1 (quick win, no key):** on booking confirm + on trip detail (and host bookings), an **"Add to calendar"** action — a **Google Calendar event-add URL** + a downloadable **.ics** file (works with Apple/Google/Outlook). Pre-filled with stay dates, listing title, address, confirmation code. Same for the host side (check-in/out events).
- **v2 (real sync):** two-way Google Calendar sync via OAuth (needs a Google API key/consent) — auto-add + updates on change/cancel.

**Feasibility:** the **.ics + Google-Calendar-link v1 is buildable now, no backend/key** (pure client-side generated from the booking). Real auto-sync needs Google Calendar OAuth.
**Effort:** S (add-to-calendar v1) · L (real sync). **Needs:** none for v1; Google OAuth for sync. **Status:** 💡 logged — **quick win.** **Touches:** booking confirm + trip detail + host bookings.

### 14. Geo-tagged posts — viewer sees the location + "what's famous here" — _your pitch, 2026-05-25_
**Raw idea:** when someone posts, the viewer should see **where** it is on a map and **details** like what's famous about that place.

**Captured + expanded:** every story/post carries a **location tag**; the viewer gets:
- A **place chip + mini-map pin** (where this was).
- A **"what's famous here"** panel — top sights, signature food, best time — pulled from the **City Guide** data (#2), with a "see homes near here" link into **Map discovery** (#4) and **live weather/what's-on** (#11).
- Tapping the location → the city's guide / nearby stays.

**Feasibility:** **near-term synthetic version is easy** — add a `location` (city) to the Stories traveler-story cards + a place panel sourced from a shared city-info module; **folds directly into the Stories redesign (#12)**. The *real* version (user-tagged posts) is part of the social layer (#9).
**Effort:** S (synthetic, as part of #12) · part of #9 for real posts. **Needs:** none for synthetic. **Status:** 💡 logged. **Pairs with / folds into:** Stories redesign (#12), City Guides (#2), Map discovery (#4), Location context (#11), Social layer (#9).

### 15. ⭐ Globe destination explorer (home hero) — spin, pin, dive into a place — _your pitch, 2026-05-25_
**Raw idea:** put an interactive **globe on the home page** with a spinning animation; **pin/select a location** → get a rich destination panel: popular destinations, **treks, dive spots, sports activities, history, best time to visit**, then the **places to stay** there. Whole app should feel **clean and Gen-Z**.

**Captured + expanded:** a flagship "where to next?" experience.
- **The globe (animation options):**
  1. **`cobe`** — tiny (~5 kB) WebGL globe (the Stripe/Vercel-style one): auto-spins, drag to rotate, glowing destination dots. Gorgeous + lightweight + very Gen-Z. Best for the **home hero**. *(my pick for the wow)*
  2. **MapLibre globe projection** — our `Map` primitive already uses MapLibre, which has a 3D globe projection; fully interactive (real clickable pins). Best for the **/discover** deep experience. Pairs with the globe hero.
  3. **`react-globe.gl` (three.js)** — arcs/points/labels, richest but heaviest.
  → Suggested: **cobe hero on home** (featured glowing destinations) → click → **destination detail**; full free-roam globe lives on `/discover`.
- **Destination detail panel** (on select): hero + history blurb, **popular spots**, **activities** (treks / dives / water-sports / etc.), **best time to visit** (+ live weather via #11), then **"Stays here"** → filtered homes. This = City Guides (#2) + Location context (#11) + activities, surfaced beautifully.
- **Clean / Gen-Z polish:** the Stories redesign (#12, shipped) set the tone — high-energy, immersive, big type, motion. Apply the same across hero surfaces.

**Feasibility:** `cobe` is **keyless**, tiny; destination content is curated (like Stories/City-Guide data). MapLibre globe needs no key. So a real v1 is buildable now. **Effort:** **M–L** (globe hero + destination detail + curated content for ~8–12 destinations). **Needs:** add `cobe` dep (tiny); no API key. **Status:** 💡 logged — **flagship candidate.** **Pairs with:** Map discovery (#4, already built), City Guides (#2), Location context (#11), Stories (#12).

### 16. Ryo Passport — collectible landmark stamps for places visited — _your pitch, 2026-05-25_
**Raw idea:** when a customer visits a place (e.g. Hyderabad) we award a **stamp of a landmark** (Charminar) and add it to their **passport / "passboard" of places visited**.

**Captured + expanded:** a **digital travel passport** on the profile.
- **Auto-stamp on a completed stay:** finishing a trip in a city earns a **landmark stamp** (Charminar = Hyderabad, Eiffel = Paris, Torii = Kyoto…), dated, like a real passport stamp.
- **The passboard:** a wall/grid of all stamps collected — a beautiful, screenshot-worthy "places I've been" page. Tap a stamp → that City Guide (#2).
- **Stamp styling:** ornate postmark frame (rotated, ink/terracotta), city + date + a landmark glyph; rare/seasonal stamps for special trips.
- **Gamification tie-in:** stamps are the **visual collectible**; **badges/score (#1)** are the achievements — together they make a "traveler identity." Counts feed the Wayfarer score; "12 stamps · 5 countries".

**Feasibility:** **v1 derivable now** — pull visited cities from the user's completed `bookings` (city/country) and render a stamp per city from a curated **city→landmark** map (glyph/illustration + label). No backend needed; custom per-landmark artwork is optional later polish. **Effort:** M (passport UI + curated landmark map + derive from trips). **Needs:** none for v1; an illustrator/SVG set for premium stamp art later. **Touches:** profile/account (coordinate with profile lane) + a `passport`/stamps module + bookings (read). **Status:** 💡 logged. **Pairs with / clusters into:** Badges & score (#1), Social profile (#9), City Guides (#2) — the "traveler identity" group.
