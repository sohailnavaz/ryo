# BNB — Multi-Agent Work Management

Single source of truth for everything happening across agents on this project.
Every agent MUST read this before starting and update it when finishing.

Last reviewed: 2026-04-23
Next scheduled review: see cron (every 7 hours)

---

## How to use this doc

1. **Before starting work** — read the `## Active assignments` table, your agent's section, and `## Invariants`.
2. **While working** — keep your row's `Status` current (`queued` → `in-progress` → `blocked` / `done`).
3. **On handoff / finish** — append an entry to `## Activity log` with date, agent, task, outcome.
4. **On milestone completion or any user-visible change** — also update [`docs/PROGRESS.md`](docs/PROGRESS.md): tick the §2 status table, add to §3 if a feature landed, append a §8 changelog line, and bump the version at the top. PROGRESS.md is the human-readable living status doc (shareable with collaborators); AGENTS_TODO.md is the internal coord layer — both must agree.
5. **If you deviate** from the plan (scope, stack, approach) — log it under `## Deviations` with rationale. The 7-hour watchdog flags any work that doesn't trace back to an entry here.

---

## Project north star

Greenfield universal Airbnb-concept app at `/Users/sohailshaik/Desktop/bnb`.

- Stack (locked): pnpm + Turborepo, Expo SDK 52, Next.js 15 App Router, NativeWind v4, Supabase, TanStack Query v5, Zustand, RHF + Zod.
- v1 scope: **guest-only** — auth, explore, search, listing detail, booking (mock payment), trips, profile, favorites.
- Shared-code rule: features live in `packages/features/<screen>/index.tsx`, built from `packages/ui`. `apps/mobile` and `apps/web` are thin route shims.
- Full plan: `/Users/sohailshaik/.claude/plans/hi-im-planning-to-zazzy-sunset.md`

---

## Invariants (do not violate without logging a Deviation)

- No `next/*` imports in `packages/features` or `packages/ui`.
- No `react-native` imports in `packages/features` or `packages/ui` (use `packages/ui` primitives).
- No host UI, no Stripe, no messaging in v1.
- Personal commits use `navazshaik.sn@gmail.com`, not the Claude login.
- Payments are mocked in v1 — do not integrate a real processor.

---

## Active assignments

| # | Agent / lane | Task | Owner dir | Status | Started | ETA |
|---|--------------|------|-----------|--------|---------|-----|
| 1 | main (this session) | Phase 1 — Scaffold (pnpm workspace + Turbo + shared tsconfig/eslint + empty apps/ and packages/) | repo root | in-progress | 2026-04-23 | 2026-04-23 |
| 2 | main (this session) | Phase 2 — Hello-world (Expo + Next.js both boot, both render `<Hello/>` from `packages/ui`) | apps/*, packages/ui | queued | — | 2026-04-23 |
| 3 | main (this session) | Phase 3 — Design system (NativeWind preset, Button/Card/Input/Sheet primitives, brand tokens) | packages/ui, packages/config | queued | — | 2026-04-23 |
| 4 | main (this session) | Phase 4 — Supabase (`supabase init`, 0001_init.sql with RLS, seed.sql, type gen) | supabase/, packages/db | queued | — | 2026-04-23 |
| 5 | unassigned | Phase 5 — Auth (magic link + Google OAuth, session hook, route guards) | packages/features/auth, packages/api | queued | — | TBD |
| 6 | unassigned | Phase 6 — Explore / Home (categories, carousels, responsive grid, query hooks) | packages/features/home | queued | — | TBD |
| 7 | unassigned | Phase 7 — Search + filters (destination, dates, guests, filter sheet, URL-synced state on web) | packages/features/search | queued | — | TBD |
| 8 | unassigned | Phase 8 — Listing detail (gallery, map, amenities, reviews, sticky booking card) | packages/features/listing | queued | — | TBD |
| 9 | unassigned | Phase 9 — Booking flow (calendar, guest stepper, price breakdown, confirm → bookings row) | packages/features/booking | queued | — | TBD |
| 10 | unassigned | Phase 10 — Trips + Profile + Favorites | packages/features/{trips,profile,favorites} | queued | — | TBD |
| 11 | unassigned | Phase 11 — Responsive polish (tablet + desktop breakpoint pass, frontend-design critique) | apps/*, packages/ui | queued | — | TBD |
| 12 | unassigned | Phase 12 — Install Anthropic skills into `~/.claude/skills/` (frontend-design, webapp-testing, brand-guidelines, theme-factory, web-artifacts-builder, skill-creator) | ~/.claude/skills | queued | — | TBD |
| 13 | unassigned | Phase 13 — Git init (repo-local user.email=navazshaik.sn@gmail.com), first commit, push to remote | repo root | queued | — | TBD |

**Status values:** `queued`, `in-progress`, `blocked`, `review`, `done`.

---

## Milestones

- [ ] M0 — Monorepo scaffold (pnpm + Turborepo, `apps/mobile`, `apps/web`, `packages/ui`, `packages/features`)
- [ ] M1 — Supabase project + schema (listings, bookings, profiles, favorites)
- [ ] M2 — Auth (guest sign-up + sign-in, shared feature)
- [ ] M3 — Explore + Search (map + list, shared feature)
- [ ] M4 — Listing detail
- [ ] M5 — Booking flow (mock payment)
- [ ] M6 — Trips + Profile + Favorites
- [ ] M7 — Polish pass + e2e on both platforms

Each milestone, when picked up, becomes rows in `Active assignments`.

---

## Deviations

Anything that diverges from the plan, invariants, or locked stack. Format:

```
- YYYY-MM-DD — <agent> — <what changed> — <why> — <approved by>
```

- 2026-04-23 — main (session aef4b0f5) — `packages/ui` primitives import from `react-native` directly (Button/Text/Card/Input/Pressable/etc. use `react-native` View/Text/Pressable/TextInput/Image) — standard NativeWind v4 universal pattern: RN primitives are the only way to render native, and Next.js resolves them to `react-native-web` via `transpilePackages`. Platform-split `.web.tsx`/`.native.tsx` files would double the primitive count and slow v1. The stricter part of the invariant — "no `react-native` imports in `packages/features`" — is upheld: feature screens only import from `@bnb/ui`. Platform-split is used only where genuinely needed: `nav` (expo-router vs next/navigation), `Map` (react-native-maps vs MapLibre), `Calendar` (react-native-calendars vs react-day-picker). — self-approved pending user review

---

## Activity log

Append-only record of finished or handed-off work. Format:

```
- YYYY-MM-DD HH:MM — <agent> — <task> — <outcome / next step>
```

- 2026-04-23 — main — created this doc and scheduled the 7-hour watchdog — awaiting first assignment
- 2026-04-23 18:30 — main (session aef4b0f5) — started M0 scaffold (root pnpm workspace, turbo, tsconfig, .gitignore, .npmrc, .prettierrc, README, .env.example) and `packages/config` (tailwind preset with brand/ink/surface tokens), `packages/utils` (cn, currency, dates), `packages/db` (placeholder types + enums for categories/amenities), `packages/api` (Supabase client, listings/bookings/favorites/reviews/auth hooks), `packages/ui` (Button, Card, Input, Text, Heading, Badge, Stack, Divider, Skeleton, IconButton, Avatar, Image, Pressable, icons re-exports) — in progress, continuing with ListingCard/CategoryBar/SearchBar/Sheet/BottomTabBar/TopNav/PriceTotal, then Next.js + Expo scaffolds, then Supabase migrations + seed + features
- 2026-04-23 — main — wrote `docs/airbnb-reference.md` (product teardown + domain model + pricing + trust/payments + what-Ryo-does-differently + v1 in/out + phase→reference map) — unblocks phases 4–11 reading prior art before they start; deviation: not on the phase list, logged here as a horizontal reference asset. Next: phase 4 owners should read §3 + §5 before writing the schema.

---

## Watchdog (every 7 hours)

A cron-scheduled agent reads this file and checks:

1. Every `in-progress` row has been updated within the last 24h (otherwise: flag stale).
2. No row's ETA is in the past without a `Deviation` explaining the slip.
3. No recent commits / file changes in `bnb/` that aren't traceable to a row here (otherwise: flag untracked work).
4. Invariants still hold (spot-check `packages/features` for forbidden imports).
5. Memory in `/Users/sohailshaik/.claude/projects/-Users-sohailshaik-Desktop-bnb/memory/` is consistent with this doc.
6. [`docs/PROGRESS.md`](docs/PROGRESS.md) status table and changelog agree with this file's Activity log. Flag drift.

The watchdog writes findings to `## Activity log` and, if it finds deviations, appends them to `## Deviations` with a `needs-review` tag.
