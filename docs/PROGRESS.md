---
doc: PROGRESS
purpose: Human-readable living status doc. Safe to share with collaborators, investors, or friends.
last_updated: 2026-05-12
version: 0.7.0
---

# Ryo — Progress

> *Living document.* Updated whenever a milestone moves, a feature lands, or a decision changes scope. See [§ How to update this doc](#how-to-update-this-doc) at the bottom.

**Quick links:** [Brand](./branding.md) · [Product specs](./README.md) · [Agent coordination](../AGENTS_TODO.md) · [Repo README](../README.md)

---

## 1. What Ryo is

**Ryo** (from Japanese 旅, *journey*) is a short-term-stays platform built around one idea — *a great stay should feel like being a guest, not a customer.* Every host vetted, every guest backed by a 24/7 multilingual concierge, every stay covered by service guarantees. It's what Airbnb would look like if hospitality — not scale — was the product.

- **Codebase alias:** `bnb` (legacy dir name) → being rebranded to `ryo`. See [branding §12](./branding.md#12-naming-migration-bnb--ryo).
- **Tagline (locked):** *Just Ryo it.*
- **Owner:** Makuta Developers — dm@makutadevelopers.com
- **Stage:** v1 in build — guest-only (no host UI, mock payments).

---

## 2. Current status (milestones)

| # | Milestone | State | Notes |
|---|-----------|-------|-------|
| M0 | Monorepo scaffold | ✅ done | pnpm + Turborepo + shared tsconfig/tailwind — `apps/{web,mobile}`, `packages/{ui,features,api,db,utils,config}`. `pnpm typecheck` green, `next build` green. |
| M1 | Supabase schema | ✅ done | `supabase/migrations/0001_init.sql` — profiles / listings / listing_photos / bookings / reviews / favorites; full RLS + `on_auth_user_created` trigger; `seed.sql` with 20 listings. |
| M2 | Auth | 🟡 code landed, unverified | `SignInScreen` + `AuthGate` + `packages/api/auth.ts` wired. Magic-link + Google OAuth round-trip not yet tested against a live Supabase project. |
| M3 | Explore + Search | 🟡 code landed, unverified | `HomeScreen`, `CategoryBar`, `SearchBar`, `FilterSheet`, `Map` (web/native split). Live data + polish pass pending. |
| M4 | Listing detail | 🟡 code landed, unverified | `ListingScreen` — gallery / amenities / sticky booking card built from `@bnb/ui` primitives. Live-content wiring pending. |
| M5 | Booking flow | 🟡 code landed, unverified | `BookingScreen` + `Calendar` (web/native split) + `PriceTotal`. Mock-payment confirm → `bookings` row happy path pending. |
| M6 | Trips / Profile / Favorites | 🟡 code landed, unverified | All three screens built. Live-data wiring + auth-gated routes pending. |
| — | Product specs | ✅ done | 14 UI-agnostic module docs (`docs/00-overview` + `docs/02`–`14`) + `docs/README.md` index + `docs/airbnb-reference.md` + `docs/branding.md` + this doc. |
| M7 | Responsive polish + e2e | ⚪ queued | Tablet/desktop breakpoint pass + `frontend-design` skill critique against brand. |
| — | Live verification | ⚪ queued | Spin up Supabase project, wire env vars, confirm auth + booking happy path on web + iOS sim. Tracked as row 15 in [AGENTS_TODO](../AGENTS_TODO.md). |
| — | Rebrand `bnb` → `ryo` | ⚫ blocked | Single PR — blocked on logo + domains ([branding §12](./branding.md#12-naming-migration-bnb--ryo)). |

**Legend:** ✅ done · 🟡 code landed, live-verification pending · 🟠 in progress · ⚪ queued · ⚫ blocked

---

## 3. What's built today

### Design system (`packages/ui`)
Primitives (Button, Card, Input, Text, Heading, Badge, Stack, Divider, Skeleton, IconButton, Avatar, Image, Pressable) + composites (ListingCard, CategoryBar, SearchBar, Sheet, BottomTabBar, TopNav, PriceTotal). Platform-split where native APIs diverge: `Map` (react-native-maps / MapLibre), `Calendar` (react-native-calendars / react-day-picker), `nav` (expo-router / next/navigation).

### Features (`packages/features`) — shared across web + mobile
- `auth/` — SignInScreen, AuthGate
- `home/` — HomeScreen (explore feed)
- `search/` — FilterSheet
- `listing/` — ListingScreen (detail)
- `booking/` — BookingScreen
- `trips/` — TripsScreen
- `profile/` — ProfileScreen
- `favorites/` — FavoritesScreen
- `host/` — full host site (v2-preview, web-only): `HostShell` + Dashboard · Calendar · Bookings (list + detail) · Listings (list + read-only editor) · Earnings · Inbox (list + thread) · Reviews · Settings · Insights stub
- `admin/` — full admin site (v2-preview, web-only): `AdminShell` + Overview · Search · Users (list + inspector) · Bookings (list + inspector) · Moderation · Incidents · Finance · Flags · Audit log · System health
- `state/` — Zustand store

### Backend (`supabase/` + `packages/api`)
- Migration `0001_init.sql` — tables, enums, RLS policies, seed data
- API hooks: `listings`, `bookings`, `favorites`, `reviews`, `auth`, `filters` (TanStack Query wrappers)
- v2-preview synthetic data: `host` (`useHostDashboard`), `admin` (`useAdminDashboard`) — derive plausible bookings/earnings/users from the existing public-read listings, no schema or RLS changes
- Dummy-listings fallback (`packages/api/src/dummy-listings.ts`) — 16 listings with deterministic ids; activates when Supabase isn't configured. **Must hard-fail in `NODE_ENV=production`** per [path-to-production plan M9.3](#);  currently always falls back.

### Apps
- **Web** (`apps/web`): Next.js 15 App Router with `(main)`, `auth`, `sign-in` route groups; providers + globals wired. `next build` green — 30 routes, 328 kB first-load JS on dynamic pages.
- **Mobile** (`apps/mobile`): Expo Router with `(tabs)`, `auth`, `booking`, `listing`, `sign-in.tsx`. Metro monorepo config + NativeWind v4 + `moduleResolution=bundler` for typecheck. Typecheck green; native simulator smoke-test pending.

### Product specs (`docs/`)
UI-agnostic capability specs — these define *what Ryo does* and are authoritative when the UI changes.

| # | Module | Covers |
|---|--------|--------|
| — | [branding.md](./branding.md) | Brand identity, voice, visual system, tagline (*Just Ryo it.*), design ethos |
| 00 | [overview.md](./00-overview.md) | Company vision, positioning, differentiators, success metrics |
| 02 | [auth-identity.md](./02-auth-identity.md) | Accounts, KYC, host verification, sessions, roles |
| 03 | [listings.md](./03-listings.md) | Listing creation, curation, quality tiers, calendars, pricing |
| 04 | [search-discovery.md](./04-search-discovery.md) | Search, filters, map, personalization |
| 05 | [bookings.md](./05-bookings.md) | Booking lifecycle, instant-book, modifications, cancellations |
| 06 | [payments-payouts.md](./06-payments-payouts.md) | Payments, multi-currency, escrow, host payouts, taxes |
| 07 | [messaging.md](./07-messaging.md) | Guest↔host chat, auto-translate, concierge co-pilot |
| 08 | [reviews-ratings.md](./08-reviews-ratings.md) | Two-way reviews, verified-stay only, moderation |
| 09 | [notifications-mail.md](./09-notifications-mail.md) | Email, push, SMS, in-app; worldwide deliverability |
| 10 | [i18n-localization.md](./10-i18n-localization.md) | Languages, RTL, currency, region rules |
| 11 | [trust-safety.md](./11-trust-safety.md) | Verification, disputes, fraud, SOS, insurance |
| 12 | [concierge-support.md](./12-concierge-support.md) | **Ryo differentiator** — 24/7 multilingual concierge |
| 13 | [host-tools.md](./13-host-tools.md) | Host dashboard, calendar sync, analytics, payouts |
| 14 | [admin-ops.md](./14-admin-ops.md) | Internal admin console, moderation, finance, audit |
| — | [airbnb-reference.md](./airbnb-reference.md) | Product teardown of Airbnb — reference while building v1 |

Concierge (§12) and Trust & Safety (§11) are the load-bearing differentiators — weigh decisions there carefully.

---

## 4. Architecture at a glance

```
apps/web (Next.js 15)      apps/mobile (Expo SDK 52)
        \                  /
         packages/features   ← shared screens (write once)
                 |
         packages/ui         ← cross-platform primitives (NativeWind v4)
                 |
         packages/api        ← Supabase client + TanStack Query hooks
                 |
         Supabase (Postgres + Auth + Storage + RLS)
```

**Invariant:** `packages/features` imports only from `packages/ui` and `packages/api` — never from `next/*` or `react-native` directly. Route files in `apps/*` are thin shims that import the feature screen.

**State:** Server state via TanStack Query v5. Client state via Zustand. Forms via React Hook Form + Zod.

---

## 5. What's next (top 3)

1. **Verify auth end-to-end** (M2) — magic-link + Google OAuth on both web and iOS; confirm RLS on a live Supabase project.
2. **Wire live data into Home + Listing + Booking** (M3–M5) — replace seed/placeholder content, confirm the guest booking happy path creates a `bookings` row.
3. **Responsive + design-system critique pass** (M7) — tablet/desktop breakpoints, `frontend-design` skill review against brand (clean / minimal / luxurious).

Rolling TBDs tracked in [AGENTS_TODO.md](../AGENTS_TODO.md) (active assignments table).

---

## 6. How to try it

Local (requires Docker Desktop running for Supabase):

```bash
pnpm install
pnpm dlx supabase start
pnpm dlx supabase db reset      # applies 0001_init.sql + seed.sql

cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env.local
# paste SUPABASE_URL + anon key from `supabase start` output

pnpm dev                         # web on :3000, Expo on :8081
```

No deployed preview URL yet. When Vercel is wired up, paste it here.

---

## 7. Open questions / where feedback helps

These are the calls I'd most like a second opinion on. If you're reviewing, skim these first.

- **Brand direction** — does *"Just Ryo it."* + *clean / minimal / luxurious* land for a short-term-rental brand? ([branding §5](./branding.md#5-messaging-framework), [§7](./branding.md#7-visual-identity))
- **Hero accent** — terracotta `#C87156` vs. ocean teal `#1F5A6B`. Both defined. ([branding §7.2](./branding.md#72-colour-palette-))
- **Home default** — map-first or list-first on first load? Airbnb toggles; we'd rather commit.
- **Mock payments vs. real** — v1 is mock. Is that the right call to ship faster, or does it undermine the "service guarantees" pitch?
- **Launch markets** — India + SE Asia leaning, but global-from-day-one i18n. Over-indexing?

---

## 8. Changelog

Append-only, newest first. One line per shipped thing. Version bumps follow branding.md convention (patch / minor / major).

### `0.7.0` — 2026-05-12

**Host + admin site expansion (Phases 22–24 in AGENTS_TODO).** 21 new routes, ~18 new feature screens, 16 new synthetic-data hooks, shared `DashboardShell` powering all three audiences (guest · host · admin).

- **Shared dashboard shell.** New `DashboardShell` in `packages/features/src/shared/dashboard-shell.tsx`: desktop sidebar rail (sticky) on md+, horizontal scrollable tab strip on mobile, active-route highlighting, persistent `PreviewBanner`. `HostShell` and `AdminShell` are thin wrappers that pass their nav lists. Existing `/host` and `/admin` refactored to render inside their shell — same look across every page in the host / admin sites.
- **Host pages (10 new):** `/host/calendar` (60-day grid w/ available/booked/blocked colour-coding + iCal-feed status), `/host/bookings` + `/host/bookings/[id]` (filterable list + detail w/ payout breakdown, activity timeline, reversible actions), `/host/listings` + `/host/listings/[id]/edit` (list view + read-only editor showing photos / basics / amenities / pricing / rules), `/host/earnings` (this-month / last-month / YTD switcher, payout queue, by-listing table), `/host/inbox` + `/host/inbox/[id]` (threads list + chat detail w/ reservation sidebar), `/host/reviews` (rating KPI + 6-month trend chart + full list), `/host/settings` (profile / payout / tax / co-host team), `/host/insights` (v3 stub).
- **Admin pages (11 new):** `/admin/search` (global search grouped by entity kind), `/admin/users` + `/admin/users/[id]` (search + 4-tab inspector — profile / bookings / tickets / audit-trail), `/admin/bookings` + `/admin/bookings/[id]` (filterable list + inspector w/ payment trail, host payout, reason-code action menu), `/admin/moderation` (tabbed listings + flagged-reviews queues), `/admin/incidents` (3-tier queues + selected-incident drawer), `/admin/finance` (GMV chart + 14-day reconciliation + payout queue + chargebacks), `/admin/flags` (toggle list w/ emergency kill-switches highlighted), `/admin/audit` (filterable log by actor / action), `/admin/health` (live signals + recent releases + planned maintenance).
- **Synthetic-data surface.** All new screens read from `useHost*` / `useAdmin*` hooks in `packages/api/src/{host,admin}.ts`. Derived deterministically from `DUMMY_LISTINGS` + seeded RNG keyed on entity id — so every deep link (`/host/bookings/l-positano-cliffside-up-0`, `/admin/users/u3`) resolves the same way every time. No schema, no RLS, no real auth gating.
- **Privileged actions.** Every destructive admin action (suspend user, cancel booking, refund, approve listing, toggle flag, etc.) renders the reason-code/confirm copy and shape, but on submit emits a `toast` saying "Preview only — no change persisted". Real wiring lands when v2 ships per [§14 admin-ops](./14-admin-ops.md).
- **Verified.** `pnpm typecheck` green across `@bnb/{api,ui,features,web}`; `next build` green (30 routes, 328 kB first-load JS); dev-server smoke test confirms HTTP 200 on all new routes including dynamic deep links.

### `0.6.0` — 2026-05-11

- **Vercel preview deploy enabled.** `vercel.json` at repo root configures the pnpm-workspace install + monorepo build (`pnpm turbo run build --filter=@bnb/web`) and sets `NEXT_PUBLIC_RYO_PREVIEW_MODE=1` so a Vercel import-from-GitHub flow Just Works without needing Supabase env vars. See `docs/TODO.md` § 🚀 Share for step-by-step.
- **Preview escape hatch added.** `listings.ts` hard-fail in prod is now opt-in-bypassable via `NEXT_PUBLIC_RYO_PREVIEW_MODE=1`. Default behaviour unchanged.
- **Profile edit mode.** Name / language / currency are now editable on `/profile`. Demo writes through to `setDemoUser` + localStorage; real signed-in writes call `supabase.auth.updateUser`. Toast feedback throughout.
- **Booking cancellation.** New `useCancelBooking` mutation; cancel button on `/trips` for upcoming bookings; 2-tap confirm card; toast feedback. Sets `bookings.status = 'cancelled'` (refund-policy logic lands with real payments per `docs/05-bookings.md §4.4`).
- **Google OAuth button.** `useSignInWithGoogle` mutation + button on `SignInScreen`. Disabled when Supabase isn't configured; real flow when wired.

### `0.5.0` — 2026-05-11

**M9 — production-blocking fixes landed.**

- **9.1 Booking double-booking race fixed.** New migration `0002_booking_locks.sql` adds a `btree_gist` exclusion constraint on `(listing_id, daterange)` over non-cancelled bookings. Two concurrent bookings of overlapping dates now resolve to exactly one winner; the loser surfaces as a typed `BookingDatesTakenError` thrown by `useCreateBooking`.
- **9.2 Error UX layer.** New `Toast` and `ErrorBoundary` primitives in `@bnb/ui` (brand-voice: no "Oops!", warm-but-precise copy, calm restraint). Wired into the web `(main)` shell. `BookingScreen` now toasts success / warning (dates taken) / error instead of `console.warn`-ing into the void.
- **9.3 Production safeguard.** `fetchListings` / `fetchListing` refuse to silently serve dummy data when `NODE_ENV=production` — a misconfigured production deploy now fails loudly with a clear "wire `NEXT_PUBLIC_SUPABASE_URL`" message instead of showing fake listings to real users.

**Demo auth path (phase 19).**
- New `packages/api/src/demo-auth.ts` — sign in as Mira (demo) when Supabase isn't wired, persisted to localStorage. `AuthGate`'d routes (`/trips`, `/wishlists`, `/booking/[id]`) accept the demo identity; `/account` greets by name; sign-out clears it. Real Supabase sessions always win once configured.
- `docs/TODO.md` — punchy, prioritised launch checklist distilled from the production plan. Split into founder ⏳ items and engineering M8–M18.

### `0.4.0` — 2026-05-11
- **Guest dashboard `/account` landed.** Closes the gap that host + admin previews existed but the regular guest had no unified hub. Time-of-day greeting, 4-KPI ribbon (upcoming · past · favourites · messages), next-trip hero, upcoming/past lists, favourites grid, account quick-links. `/dashboard` redirects → `/account`.
- **Shared dashboard chrome.** `PreviewBanner` + `SectionHeader` extracted to `packages/features/src/shared/dashboard-chrome.tsx`; host + admin + account all import from there. Three dashboards now visually consistent.
- **Synthetic-fallback pattern unified.** New `useGuestDashboard()` mirrors the pattern from `useHostDashboard()` / `useAdminDashboard()`: real Supabase data where RLS allows, deterministic synthetic data derived from `DUMMY_LISTINGS` otherwise; an `isPreview` flag drives whether the banner shows. All three dashboards now use the same approach.
- **Repo pushed to GitHub** — public at <https://github.com/sohailnavaz/ryo>. Two commits (`c796b6e`, `09259bd`).

### `0.3.0` — 2026-04-25
- **Nativewind-on-web wiring fixed.** Tailwind classes now reach the DOM through `<View className="…">` shared-feature components. Web tsconfig got `jsxImportSource: "nativewind"`, web Tailwind config got `nativewind/preset`. Verified live: brand utilities (`bg-surface`, `text-brand-500`, `shadow-card`, `md:flex`, etc.) merged into rendered class lists.
- **Phase 17 — v2-preview slice landed.** New web routes:
  - `/host` — host dashboard. KPI row (active homes · upcoming check-ins · this-month earnings · rating · occupancy · response rate), upcoming/in-stay bookings list, listings grid, recent reviews. See [13 host-tools](./13-host-tools.md).
  - `/admin` — maintenance / operations dashboard. KPI row (users · listings · bookings 30d · GMV 30d · avg rating · open incidents), recent bookings, moderation queue, system health, audit log, users table. See [14 admin-ops](./14-admin-ops.md).
  - Both routes use synthetic data (no schema or RLS changes); explicit "v2 preview" banner; not linked from main TopNav. Crosses v1 invariant — logged as Deviation 2026-04-25 in [AGENTS_TODO.md](../AGENTS_TODO.md). Will be replaced with real Supabase queries + role gates when v2 ships.
- **Dummy-listings fallback added.** Explore feed was empty (`No listings match your filters.`) because Supabase isn't wired yet. New `packages/api/src/dummy-listings.ts` exports 16 listings with deterministic ids (`l-positano-cliffside`, `l-tulum-beach`, …) mirroring `supabase/seed.sql`. `fetchListings()` and `fetchListing()` fall back to dummy data when Supabase isn't configured *or* the live table returns zero rows. Same filter semantics. Must hard-fail in `NODE_ENV=production` before launch — tracked as M9.3 in the path-to-launch plan.
- **Business handout authored** — [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) v0.1.0: investor / partner one-pager covering problem · product · audience · how Ryo makes money (take rate, escrow, unit economics) · why this beats Airbnb · market · GTM · roadmap · defensibility · risks. Indexed at the top of [README.md](./README.md).
- **Production-readiness audit + path-to-launch plan.** Two parallel Explore audits (feature completeness vs operational gaps) → 11 sequenced milestones M8–M18, ~32 engineering days, ~9 weeks calendar (Apple/Google review + DNS waits included). Plan file at `~/.claude/plans/lets-check-the-developement-crispy-nygaard.md`. Surfaced one high-priority code bug — the booking double-booking race in `supabase/migrations/0001_init.sql` (no exclusion constraint on `(listing_id, date)` overlap) — slated for M9.1.

### `0.2.0` — 2026-04-24
- Added §3 Product specs table (14 module docs + airbnb-reference + branding).
- §2 milestone table aligned with [AGENTS_TODO.md](../AGENTS_TODO.md) rows after watchdog reconciliation: M2–M6 state clarified as *code landed, live-verification pending* (was previously labelled ambiguously as "built, unverified"), split "Live verification" and "Rebrand bnb → ryo" into separate rows.
- Legend updated: ⚫ blocked added.
- Quick-links row surfaces [docs/README.md](./README.md) as the product-specs index.
- Note: does not reflect new shipped features — this version is reconciliation-only.

### `0.1.0` — 2026-04-23
- Initial progress doc. Captured current state: M0 + M1 complete, M2–M6 screens built but not verified end-to-end, M7 queued.

---

## How to update this doc

1. When a milestone moves — update the status table in §2.
2. When a feature lands — add a line to §3 and a changelog entry in §8.
3. When priorities shift — rewrite §5 (don't append; keep it to 3).
4. When you want outside input — add to §7.
5. **Bump the version** at the top (patch = clarification, minor = new section / filled-in TBD, major = scope change).
6. This doc follows `docs/branding.md`'s "living doc" pattern: the doc is the truth; code follows the doc, never the other way around.

The [AGENTS_TODO.md](../AGENTS_TODO.md) handoff rule requires every agent finishing a milestone to also append here — so this stays current without a manual sweep.
