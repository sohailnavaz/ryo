# CLAUDE.md — Ryo: rules, roles & A‑to‑Z

> **This is the single file to read first.** It is the authoritative map of *what
> Ryo is, who does what, the rules of the work, and where everything lives.* For
> deep detail it points to the source-of-truth docs rather than duplicating them
> (so it can't drift). If anything here disagrees with reality, fix reality or fix
> this file — don't let them diverge.

Last updated: 2026-05-22

---

## 1. What this is

**Ryo** (旅, Japanese for *journey*) is a universal short-term-stays app — iOS,
Android, and responsive web from one codebase. Brand ethos: *omotenashi* — every
guest **hosted**, not just accommodated.

- **Codebase alias:** the repo folder and package names are still `bnb` (legacy). `bnb` only ever appears in code/paths — **"Ryo" is the product name in all user-facing copy.** Full rename is a single future PR, blocked on logo + domains ([branding.md §12](docs/branding.md#12-naming-migration-bnb--ryo)).
- **Tagline (locked):** *Just Ryo it.*
- **One-line pitch:** vetted hosts, a 24/7 multilingual concierge, honest pricing, and real guarantees — in an app that feels prepared just for you.

> **There is no "owner" entity.** Do not attribute the project to any company or
> person, and do not add an owner/contact line to partner-facing materials. (See §10.)

---

## 2. Roles

### 2a. Product roles — who uses the app (three doors, one product)

| Role | What they do | Where in the app |
|---|---|---|
| 🧳 **Guest** | Search, book, stay, manage trips | main app (`/`, `/listing`, `/booking`, `/trips`, `/wishlists`, `/account`, `/profile`) |
| 🏠 **Host** | List & manage homes, calendar, bookings, earnings, inbox | `/host/*` |
| 🛠️ **Team (Admin)** | Keep the platform safe & fair: moderation, incidents, finance, audit | `/admin/*` |

### 2b. Working roles — how we operate

- **Any agent / contributor** must read [`AGENTS_TODO.md`](AGENTS_TODO.md) (the coordination layer) **before** starting, keep their row's status current, and append to its Activity log on finish.
- **Watchdog** (scheduled review) flags work that doesn't trace back to an `AGENTS_TODO.md` entry, and surfaces drift between the three status sources.
- **Doc-sync rule:** any milestone move or user-visible change must update **both** `AGENTS_TODO.md` (internal) **and** [`docs/PROGRESS.md`](docs/PROGRESS.md) (shareable) — they must agree.

---

## 3. Golden rules / invariants  *(do not violate without logging a Deviation in AGENTS_TODO.md)*

1. **Shared-code boundary.** Screens live in `packages/features/<screen>` and are built from `@bnb/ui`. `apps/web` and `apps/mobile` route files are *thin shims* that import the feature screen.
2. **No `next/*`** imports in `packages/features` or `packages/ui`.
3. **`packages/features`** may import **layout-only** primitives from `react-native` (`View`, `FlatList`, `ScrollView`, `Image`, `useWindowDimensions`) — *everything else* (buttons, inputs, typography, cards, sheets, interactive behaviour) must come from `@bnb/ui`.
4. **`packages/ui`** primitives may import from `react-native` (that's how they render natively; `react-native-web` resolves them on web via `transpilePackages`). Platform-split (`.web.tsx`/`.native.tsx`) only where APIs genuinely diverge: `nav`, `Map`, `Calendar`.
5. **Brand is doc-driven.** [`docs/branding.md`](docs/branding.md) is the single source of truth for all brand decisions; code follows the doc, never the reverse.
6. **Git identity.** Personal commits use `navazshaik.sn@gmail.com` (repo-local `user.email`), not the Claude login.
7. **Partner / external materials:** no "owner" entity, no timelines unless asked, and **do not downgrade Airbnb** — Ryo may be described as familiar/easy-to-use, but never by knocking competitors. (See §10.)

---

## 4. Tech stack (locked)

pnpm workspaces + **Turborepo** · **Expo SDK 52** + Expo Router v4 (mobile) ·
**Next.js 15** App Router (web) · **NativeWind v4** + Tailwind · **Supabase**
(Postgres + Auth + Storage + RLS) · **TanStack Query v5** (server state) ·
**Zustand** (client state) · **React Hook Form + Zod** (forms). Node ≥ 20.11, pnpm ≥ 10.

---

## 5. Repo structure

```
apps/
  web/        Next.js — (main) / auth / sign-in route groups (thin route shims)
  mobile/     Expo Router — (tabs) / auth / booking / listing / sign-in
packages/
  ui/         Cross-platform primitives (NativeWind) + composites
  features/   Shared screens (write once) — auth, home, search, listing,
              booking, trips, profile, favorites, account, host, admin, shared, state
  api/        Supabase client + TanStack Query hooks (listings, bookings, favorites,
              reviews, auth, profile, host, admin, guest, demo-auth, dummy-listings)
  db/         Generated Supabase types
  config/     Shared tsconfig / tailwind / eslint
  utils/      Helpers
supabase/
  migrations/ 0001_init.sql (schema + RLS + trigger), 0002_booking_locks.sql
  seed.sql    20 listings
docs/         Brand bible, 14 module specs, PROGRESS, BUSINESS_MODEL, partner docs (§9)
AGENTS_TODO.md  Coordination layer (read before work)
```

---

## 6. Commands

```bash
pnpm install
pnpm dlx supabase start          # local Supabase (needs Docker Desktop)
pnpm dlx supabase db reset       # applies migrations + seed.sql

cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env.local   # paste SUPABASE url + anon key

pnpm dev          # web on :3000 + Expo on :8081 (parallel)
pnpm dev:web      # web only
pnpm dev:mobile   # Expo only (i = iOS sim, a = Android, w = web)

pnpm typecheck    # turbo typecheck across packages — keep green
pnpm build        # turbo build — next build must stay green
pnpm lint
pnpm db:types     # regenerate packages/db/supabase.types.ts
```

**Definition of "done (code)":** `pnpm typecheck` green **and** `next build` green.
Breakpoints: Tailwind `sm 640 / md 768 / lg 1024 / xl 1280` — mobile below `md`, tablet/desktop above.

---

## 7. Conventions

- **State:** server state via TanStack Query; client state via Zustand; forms via RHF + Zod.
- **Synthetic-data pattern:** host/admin (and guest dashboard) hooks return real Supabase data where RLS allows, and deterministic synthetic data (seeded RNG keyed on entity id, derived from `DUMMY_LISTINGS`) otherwise — an `isPreview` flag drives a "preview" banner. Privileged admin actions render reason-code + confirm flows but only `toast` "Preview only" until v2.
- **Production safety:** `listings.ts` hard-fails in `NODE_ENV=production` rather than silently serving dummy data — bypassable only via `NEXT_PUBLIC_RYO_PREVIEW_MODE=1`.
- **Commits:** conventional style (`feat(...)`, `docs(...)`, `chore(...)`). Branch off `main`; only commit/push when asked.

---

## 8. Current status (snapshot — keep in sync with PROGRESS.md)

- **M0–M1 done:** monorepo scaffold; Supabase schema (profiles / listings / listing_photos / bookings / reviews / favorites) + RLS + seed.
- **M2–M6 (guest flow) — code landed:** auth, explore, search, listing detail, booking (mock payment), trips, profile, favorites.
- **M8 — live Supabase wired** (project ref `mtldmawenkdebtchnocs`); 20 listings seeded; dummy + demo-auth now dormant. **Vercel env still TODO.**
- **Account hub** (`/account`) and **host create-listing + my-listings** now persist to Supabase for real.
- **v2-preview** host (`/host/*`) + admin (`/admin/*`) sites exist with synthetic data + preview banners.
- **Queued / pending:** real payments + payouts, 24/7 concierge tooling, every host/admin action live, i18n wiring, App Store publishing, public live URL, `bnb → ryo` rename.

Authoritative status: [`docs/PROGRESS.md`](docs/PROGRESS.md) · path-to-launch checklist: [`docs/TODO.md`](docs/TODO.md).

---

## 9. Documentation map

| File | Purpose |
|---|---|
| **`CLAUDE.md`** (this) | First read — rules, roles, A‑to‑Z |
| [`AGENTS_TODO.md`](AGENTS_TODO.md) | Coordination layer — assignments, invariants, deviations, activity log |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | Living, shareable status |
| [`docs/TODO.md`](docs/TODO.md) | Prioritised path-to-launch checklist |
| [`docs/branding.md`](docs/branding.md) | Brand bible (source of truth for all brand) |
| [`docs/BUSINESS_MODEL.md`](docs/BUSINESS_MODEL.md) | Business / investor one-pager |
| [`docs/README.md`](docs/README.md) | Index of the 14 UI-agnostic module specs (`00`, `02`–`14`) |
| [`docs/PARTNER_OVERVIEW.md`](docs/PARTNER_OVERVIEW.md) · [`docs/Ryo-Partner-Briefing.md`](docs/Ryo-Partner-Briefing.md) | Partner-facing source text |
| `docs/Ryo-Partner-Briefing.pdf` | **Current shareable partner briefing** — minimalist, visual (flowcharts), no owner line, no timelines, no Airbnb comparison |

---

## 10. Partner & external-communications rules

When producing anything a partner / investor / outsider will see:

1. **No owner entity.** Don't name a company or person as owner; no owner/contact line.
2. **No timelines** unless explicitly requested.
3. **Don't downgrade Airbnb** (or any competitor). Ryo can be called familiar / easy-to-use; never frame the pitch as "Airbnb is bad."
4. **Brand voice:** calm, warm, honest, quietly luxurious — *omotenashi*. Colours: terracotta `#C87156` (sparingly), ocean teal `#1F5A6B`, ink navy `#0E1A2B`, warm cream `#FAF6F0`. Type: Fraunces (display) + Inter (body).
5. **Prefer visuals** — flowcharts, diagrams, icon cards — over walls of text. Be a minimalist: one clear line per idea.
6. **Be honest** about status: real listings live; payments still in "demo" mode; concierge planned.

---

## 11. How to keep this file true

- Update this file whenever a **rule, role, command, or invariant changes** — and whenever the status snapshot (§8) drifts from `docs/PROGRESS.md`.
- It is a **map, not a mirror**: keep deep detail in the linked source-of-truth docs; keep this file short, current, and authoritative.
- On any milestone move or user-visible change, the doc-sync rule (§2b) still applies: update `AGENTS_TODO.md` + `docs/PROGRESS.md` too.
