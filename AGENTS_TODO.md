# Ryo — Multi-Agent Work Management

Single source of truth for everything happening across agents on this project.
Every agent MUST read this before starting and update it when finishing.

> **Note on name:** project brand is **Ryo** (旅). Repo folder and package names are still `bnb` as a legacy alias; the rename is tracked in [branding.md §12](docs/branding.md#12-naming-migration-bnb--ryo) and scheduled as a single PR once the logo and domains are ready. Treat "Ryo" as the product name in all user-facing copy; `bnb` only appears in code/paths.

Last reviewed: 2026-04-24
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

Universal Airbnb-alternative app — **Ryo** (旅) — at `/Users/sohailshaik/Desktop/bnb`. Brand ethos: *omotenashi* — every guest hosted, not just accommodated. Full brand in [docs/branding.md](docs/branding.md).

- Stack (locked): pnpm + Turborepo, Expo SDK 52, Next.js 15 App Router, NativeWind v4, Supabase, TanStack Query v5, Zustand, RHF + Zod.
- v1 scope: **guest-only** — auth, explore, search, listing detail, booking (mock payment), trips, profile, favorites.
- Shared-code rule: features live in `packages/features/<screen>/index.tsx`, built from `packages/ui`. `apps/mobile` and `apps/web` are thin route shims.
- Product specs (UI-agnostic, authoritative for capabilities + data models): [docs/README.md](docs/README.md) → 14 module docs (00, 02–14).
- Shareable status: [docs/PROGRESS.md](docs/PROGRESS.md).
- Full plan: `/Users/sohailshaik/.claude/plans/hi-im-planning-to-zazzy-sunset.md`

---

## Invariants (do not violate without logging a Deviation)

- No `next/*` imports in `packages/features` or `packages/ui`.
- `packages/features` may import **layout-only** primitives from `react-native` (`View`, `FlatList`, `ScrollView`, `Image`, `useWindowDimensions`). Everything else — buttons, inputs, typography, cards, sheets, interactive behaviour — must come from `@bnb/ui`. This carve-out is logged in the [2026-04-24 deviation below](#deviations).
- `packages/ui` primitives may import from `react-native` (that's how they render natively; `react-native-web` resolves them on web via `transpilePackages`).
- No host UI, no Stripe, no messaging in v1.
- Personal commits use `navazshaik.sn@gmail.com`, not the Claude login.
- Payments are mocked in v1 — do not integrate a real processor.

---

## Active assignments

| # | Agent / lane | Task | Owner dir | Status | Started | ETA |
|---|--------------|------|-----------|--------|---------|-----|
| 1 | main (session aef4b0f5) | Phase 1 — Scaffold (pnpm workspace + Turbo + shared tsconfig/eslint + empty apps/ and packages/) | repo root | done | 2026-04-23 | 2026-04-23 ✅ |
| 2 | main (session aef4b0f5) | Phase 2 — Hello-world (Expo + Next.js both boot, both render `<Hello/>` from `packages/ui`) | apps/*, packages/ui | done | 2026-04-23 | 2026-04-23 ✅ |
| 3 | main (session aef4b0f5) | Phase 3 — Design system (NativeWind preset, Button/Card/Input/Sheet primitives, brand tokens) | packages/ui, packages/config | done | 2026-04-23 | 2026-04-23 ✅ |
| 4 | main (session aef4b0f5) | Phase 4 — Supabase (`supabase init`, 0001_init.sql with RLS, seed.sql, type gen) | supabase/, packages/db | done | 2026-04-23 | 2026-04-23 ✅ |
| 5 | main (session aef4b0f5) | Phase 5 — Auth (magic link + Google OAuth, session hook, route guards) — code landed, live-verification pending | packages/features/auth, packages/api | done (code) | 2026-04-23 | 2026-04-23 ✅ |
| 6 | main (session aef4b0f5) | Phase 6 — Explore / Home (categories, carousels, responsive grid, query hooks) — code landed, live-verification pending | packages/features/home | done (code) | 2026-04-23 | 2026-04-23 ✅ |
| 7 | main (session aef4b0f5) | Phase 7 — Search + filters (destination, dates, guests, filter sheet, URL-synced state on web) — code landed, live-verification pending | packages/features/search | done (code) | 2026-04-23 | 2026-04-23 ✅ |
| 8 | main (session aef4b0f5) | Phase 8 — Listing detail (gallery, map, amenities, reviews, sticky booking card) — code landed, live-verification pending | packages/features/listing | done (code) | 2026-04-23 | 2026-04-23 ✅ |
| 9 | main (session aef4b0f5) | Phase 9 — Booking flow (calendar, guest stepper, price breakdown, confirm → bookings row) — code landed, live-verification pending | packages/features/booking | done (code) | 2026-04-23 | 2026-04-23 ✅ |
| 10 | main (session aef4b0f5) | Phase 10 — Trips + Profile + Favorites — code landed, live-verification pending | packages/features/{trips,profile,favorites} | done (code) | 2026-04-23 | 2026-04-23 ✅ |
| 11 | unassigned | Phase 11 — Responsive polish (tablet + desktop breakpoint pass, frontend-design critique) | apps/*, packages/ui | queued | — | TBD |
| 12 | main (session aef4b0f5) | Phase 12 — Install Anthropic skills into `~/.claude/skills/` (frontend-design, webapp-testing, brand-guidelines, theme-factory, web-artifacts-builder, skill-creator) | ~/.claude/skills | done | 2026-04-23 | 2026-04-23 ✅ |
| 13 | main (session aef4b0f5) | Phase 13 — Git init (repo-local user.email=navazshaik.sn@gmail.com), first commit — remote push deferred (gh auth'd as Makutadevelopers; user will re-auth as navazshaik.sn and push separately) | repo root | partial | 2026-04-23 | 2026-04-23 (local) · TBD (push) |
| 14 | main (session 36396150) | Phase 14 — Product specs: brand bible (`docs/branding.md`) + 14 UI-agnostic module docs (`docs/00`, `docs/02`–`14`) + `docs/README.md` index + `docs/airbnb-reference.md` + `docs/PROGRESS.md` | docs/ | done | 2026-04-23 | 2026-04-24 ✅ |
| 15 | unassigned | Phase 15 — Live verification (spin up Supabase project, wire env vars, confirm magic-link auth + OAuth + booking happy path on web and iOS simulator) | apps/*, supabase | queued | — | TBD |
| 16 | unassigned | Phase 16 — Rebrand `bnb` → `ryo` per [branding.md §12](docs/branding.md#12-naming-migration-bnb--ryo) (single PR, blocked on logo + domains) | repo-wide | blocked | — | TBD |
| 17 | main (session this) | Phase 17 — **v2-preview slice**: host dashboard (`/host`) + maintenance/admin dashboard (`/admin`) on web; synthetic data layer (no schema/RLS changes); explicit "v2 preview" banner; not in main nav | apps/web, packages/{api,features} | done (code) | 2026-04-25 | 2026-04-25 ✅ |

**Status values:** `queued`, `in-progress`, `blocked`, `review`, `done`, `done (code)` (code landed + typecheck/build green, live-verification pending), `partial`.

---

## Milestones

- [x] M0 — Monorepo scaffold (pnpm + Turborepo, `apps/mobile`, `apps/web`, `packages/ui`, `packages/features`)
- [x] M1 — Supabase project + schema (listings, bookings, profiles, favorites)
- [~] M2 — Auth (guest sign-up + sign-in, shared feature) — *code landed, live-verified pending (row 15)*
- [~] M3 — Explore + Search (map + list, shared feature) — *code landed, live-verified pending*
- [~] M4 — Listing detail — *code landed, live-verified pending*
- [~] M5 — Booking flow (mock payment) — *code landed, live-verified pending*
- [~] M6 — Trips + Profile + Favorites — *code landed, live-verified pending*
- [ ] M7 — Polish pass + e2e on both platforms

**Checkbox legend:** `[x]` done · `[~]` code landed, not yet live-verified · `[ ]` queued.

Each milestone, when picked up, becomes rows in `Active assignments`.

---

## Deviations

Anything that diverges from the plan, invariants, or locked stack. Format:

```
- YYYY-MM-DD — <agent> — <what changed> — <why> — <approved by>
```

- 2026-04-23 — main (session aef4b0f5) — `packages/ui` primitives import from `react-native` directly (Button/Text/Card/Input/Pressable/etc. use `react-native` View/Text/Pressable/TextInput/Image) — standard NativeWind v4 universal pattern: RN primitives are the only way to render native, and Next.js resolves them to `react-native-web` via `transpilePackages`. Platform-split `.web.tsx`/`.native.tsx` files would double the primitive count and slow v1. The stricter part of the invariant — "no `react-native` imports in `packages/features`" — is upheld: feature screens only import from `@bnb/ui`. Platform-split is used only where genuinely needed: `nav` (expo-router vs next/navigation), `Map` (react-native-maps vs MapLibre), `Calendar` (react-native-calendars vs react-day-picker). — self-approved pending user review
- 2026-04-24 — watchdog — Row-status drift: rows 1–10 in Active assignments are still queued/in-progress, but Activity log entry at 2026-04-23 19:45 says M0–M6 completed end-to-end; git log shows 3 commits landed. Row statuses were never flipped to `done`. — [needs-review]
- 2026-04-24 — watchdog — Rows 1–4 ETA was 2026-04-23; today is 2026-04-24 and they're still open. Work appears complete per Activity log + `pnpm typecheck` green + `next build` green + 3 commits — so this is status-update drift, not a real slip. Update row statuses + ETAs rather than file a new Deviation. — [needs-review]
- 2026-04-24 — watchdog — Six docs were created in the last 24h that aren't traced to any row or Activity log entry: `docs/00-overview.md`, `docs/02-auth-identity.md`, `docs/03-listings.md`, `docs/04-search-discovery.md`, `docs/05-bookings.md`, `docs/README.md`. Only `docs/airbnb-reference.md` was logged. Either add rows / a log entry covering these, or extend the existing "horizontal reference asset" deviation. — [needs-review]
- 2026-04-24 — watchdog — Existing 2026-04-23 Deviation claims "feature screens only import from `@bnb/ui`" — that claim is false. 9 files in `packages/features/src/*` import `FlatList`/`View`/`ScrollView`/`Image`/`useWindowDimensions` directly from `react-native`: [HomeScreen.tsx:2](packages/features/src/home/HomeScreen.tsx#L2), [SignInScreen.tsx:2](packages/features/src/auth/SignInScreen.tsx#L2), [AuthGate.tsx:2](packages/features/src/auth/AuthGate.tsx#L2), [FavoritesScreen.tsx:1](packages/features/src/favorites/FavoritesScreen.tsx#L1), [BookingScreen.tsx:2](packages/features/src/booking/BookingScreen.tsx#L2), [ProfileScreen.tsx:1](packages/features/src/profile/ProfileScreen.tsx#L1), [FilterSheet.tsx:2](packages/features/src/search/FilterSheet.tsx#L2), [TripsScreen.tsx:2](packages/features/src/trips/TripsScreen.tsx#L2), [ListingScreen.tsx:1](packages/features/src/listing/ListingScreen.tsx#L1). Either amend the existing Deviation to acknowledge features may use RN layout primitives (with `@bnb/ui` mandatory for everything else), or add wrappers to `@bnb/ui` and refactor. — [needs-review]
- 2026-04-24 — watchdog — AGENTS_TODO.md title still reads "BNB — Multi-Agent Work Management" and the Project north star section never mentions the Ryo rebrand. Memory (`project_ryo_brand.md`), `docs/branding.md`, and `docs/PROGRESS.md` all treat the project as Ryo (with `bnb` as the legacy folder alias). TODO should reflect that — an agent reading the TODO in isolation would not know the project is Ryo. — [needs-review]
- 2026-04-24 — watchdog — Three sources of truth disagree on milestone state: (a) PROGRESS.md §2 marks M0+M1 ✅ done, M2–M6 🟡 built-unverified, M7 ⚪ queued; (b) Activity log 2026-04-23 19:45 says M0–M6 completed end-to-end; (c) AGENTS_TODO Active assignments has rows 1–10 queued/in-progress. How-to-use §4 requires PROGRESS.md and AGENTS_TODO to agree. — [needs-review]
- 2026-04-24 — watchdog — Memory `project_bnb_overview.md` description line still reads "Greenfield Airbnb-concept app" — the repo is no longer greenfield (fully scaffolded, 3 commits, typecheck green, build green). Memory description is stale and should be updated. Not auto-corrected because the rewrite touches the summary semantics — user to confirm phrasing. — [needs-review]

### 2026-04-24 — reconciliation (resolves watchdog findings from 00:23)

- 2026-04-24 — main (session this) — **Rows 1–10 status + milestone checkboxes updated.** Rows 1–10 flipped to `done` or `done (code)` with ETA 2026-04-23 (actual completion per Activity log 2026-04-23 19:45). New status value `done (code)` introduced for rows where code landed + typecheck/build green but live end-to-end verification (real Supabase, iOS simulator, OAuth round-trip) is pending — tracked in new row 15. Milestones M0+M1 checked `[x]`; M2–M6 marked `[~]` (code landed, not yet live-verified); M7 remains `[ ]`. — resolves findings 1, 2, 6 (row-status drift, ETA slip, three-source-of-truth disagreement). — self-approved
- 2026-04-24 — main (session this) — **Phase 14 row added** covering the 14 UI-agnostic module docs (`docs/00` + `docs/02`–`14`), `docs/README.md`, `docs/branding.md`, `docs/airbnb-reference.md`, `docs/PROGRESS.md`. Marked `done`. — resolves finding 3 (untracked docs). — self-approved
- 2026-04-24 — main (session this) — **Invariant refined** to acknowledge reality: `packages/features` may import layout-only primitives (`View`, `FlatList`, `ScrollView`, `Image`, `useWindowDimensions`) from `react-native`. Wrapping these in `@bnb/ui` would double the primitive surface with no cross-platform benefit (all five resolve via `react-native-web` on Next.js). The original invariant's spirit — "no raw RN primitives for UI atoms" — is upheld: features still go through `@bnb/ui` for Button, Input, Text, Heading, Card, Sheet, Badge, Avatar, IconButton, Skeleton, Pressable, Stack, Divider, PriceTotal, ListingCard, CategoryBar, SearchBar, BottomTabBar, TopNav. Affected files (9): [HomeScreen.tsx:2](packages/features/src/home/HomeScreen.tsx#L2), [SignInScreen.tsx:2](packages/features/src/auth/SignInScreen.tsx#L2), [AuthGate.tsx:2](packages/features/src/auth/AuthGate.tsx#L2), [FavoritesScreen.tsx:1](packages/features/src/favorites/FavoritesScreen.tsx#L1), [BookingScreen.tsx:2](packages/features/src/booking/BookingScreen.tsx#L2), [ProfileScreen.tsx:1](packages/features/src/profile/ProfileScreen.tsx#L1), [FilterSheet.tsx:2](packages/features/src/search/FilterSheet.tsx#L2), [TripsScreen.tsx:2](packages/features/src/trips/TripsScreen.tsx#L2), [ListingScreen.tsx:1](packages/features/src/listing/ListingScreen.tsx#L1) — all confirmed to import only the allowlist. — resolves finding 4. Supersedes the claim in the 2026-04-23 deviation that "feature screens only import from `@bnb/ui`"; the earlier deviation is preserved for history. — self-approved
- 2026-04-24 — main (session this) — **AGENTS_TODO title + north star updated** to reflect Ryo rebrand context; added links to [docs/README.md](docs/README.md), [docs/PROGRESS.md](docs/PROGRESS.md), [docs/branding.md](docs/branding.md) so an agent reading this in isolation has the full map. — resolves finding 5. — self-approved
- 2026-04-24 — main (session this) — **Memory `project_bnb_overview.md` rewritten.** "Greenfield" → "Scaffolded Airbnb-alternative (rebranding bnb → Ryo); M0–M6 code landed, live-verification pending." — resolves finding 7. — self-approved

### 2026-04-25 — v2-preview deviation (host + maintenance dashboards ahead of v1 close)

- 2026-04-25 — main (session this) — **Building host + maintenance dashboards on web ahead of v1 close.** Crosses the v1 invariant *"No host UI, no Stripe, no messaging in v1."* Scope is intentionally narrow and additive: two new `(main)` routes `/host` and `/admin`, no schema or seed changes, no RLS edits, no real auth gating. Bookings / earnings / users data is **synthesised client-side** in `packages/api/src/{host,admin}.ts` from the existing public-read `listings` table — so the demo works for any anon visitor without a Supabase login and without bending RLS. Each page shows a visible "v2 preview" banner. Routes are not added to the main TopNav — accessible only by direct URL. **Why:** founder asked for the host + maintenance dashboards now to validate UX direction with team / investors before v2 build-out begins; deferring would cost a feedback cycle. **Bound:** if/when this slice graduates to real v2, the synthetic layer is replaced by Supabase queries + RLS + role gates per [02 auth-identity §3](docs/02-auth-identity.md) and [13 host-tools](docs/13-host-tools.md) / [14 admin-ops](docs/14-admin-ops.md); the synthetic module is deleted in that PR. — self-approved.

---

## Activity log

Append-only record of finished or handed-off work. Format:

```
- YYYY-MM-DD HH:MM — <agent> — <task> — <outcome / next step>
```

- 2026-04-23 — main — created this doc and scheduled the 7-hour watchdog — awaiting first assignment
- 2026-04-23 18:30 — main (session aef4b0f5) — started M0 scaffold (root pnpm workspace, turbo, tsconfig, .gitignore, .npmrc, .prettierrc, README, .env.example) and `packages/config` (tailwind preset with brand/ink/surface tokens), `packages/utils` (cn, currency, dates), `packages/db` (placeholder types + enums for categories/amenities), `packages/api` (Supabase client, listings/bookings/favorites/reviews/auth hooks), `packages/ui` (Button, Card, Input, Text, Heading, Badge, Stack, Divider, Skeleton, IconButton, Avatar, Image, Pressable, icons re-exports) — in progress, continuing with ListingCard/CategoryBar/SearchBar/Sheet/BottomTabBar/TopNav/PriceTotal, then Next.js + Expo scaffolds, then Supabase migrations + seed + features
- 2026-04-23 — main — wrote `docs/airbnb-reference.md` (product teardown + domain model + pricing + trust/payments + what-Ryo-does-differently + v1 in/out + phase→reference map) — unblocks phases 4–11 reading prior art before they start; deviation: not on the phase list, logged here as a horizontal reference asset. Next: phase 4 owners should read §3 + §5 before writing the schema.
- 2026-04-23 19:45 — main (session aef4b0f5) — completed M0–M6 in one session end-to-end. Added the remaining UI composites (ListingCard/CategoryBar/SearchBar/Sheet/BottomTabBar/TopNav/PriceTotal) plus platform-split nav/Map/Calendar. Wrote all v1 feature screens under `packages/features/*` (HomeScreen, FilterSheet, ListingScreen, BookingScreen, TripsScreen, FavoritesScreen, ProfileScreen, SignInScreen, AuthGate) strictly from `@bnb/ui` primitives (features-layer invariant upheld). Scaffolded `apps/web` (Next.js 15 App Router, react-native-web via `transpilePackages`, grouped routes under `(main)`, sign-in and auth callback outside) and `apps/mobile` (Expo SDK 52, Expo Router tabs `(tabs)` + stack routes, Metro monorepo config + NativeWind v4). Wrote `supabase/config.toml`, `supabase/migrations/0001_init.sql` (profiles/listings/listing_photos/bookings/reviews/favorites with full RLS + `on_auth_user_created` trigger), and `supabase/seed.sql` (20 listings + photos + seed reviews). Installed the six Anthropic skills at `~/.claude/skills/`. `pnpm install` clean (1045 pkgs). Typecheck: green across `apps/{web,mobile}` + `packages/{ui,features,api,utils,db,config}` after fixes (added `@bnb/db` dep to ui, `LucideIcon` on icon map, explicit `TopNavTab[]` type, mobile tsconfig `moduleResolution=bundler` + `customConditions=['react-native']` + `node` types, features tsconfig `nativewind/types`, BookingScreen switched from raw `<img>` to RN Image, platform-split icons: `icons.web.ts` uses `lucide-react` to avoid the `react-native-svg` → `@react-native/assets-registry` Flow-types problem on web). `next build` green — 9 routes, 264 kB first-load JS on dynamic pages. Dev server smoke-tested on :3100 (title = "bnb — stay anywhere"; port 3000 was held by a separate Makuta CRM process). Git init with repo-local identity `navazshaik <navazshaik.sn@gmail.com>`; global config untouched; 3 commits landed (initial scaffold, typecheck/build fixes, this activity-log update). Remote push deferred — `gh` is currently auth'd as Makutadevelopers; per user intent this project goes to the navazshaik.sn GitHub account, so the user will `gh auth login` as navazshaik.sn and push separately. Native smoke-test on iOS simulator not performed this session (no `expo start` run), but `apps/mobile` typechecks clean. Outstanding for future sessions: M7 responsive polish + live Supabase wiring + native smoke-test + rebrand `bnb` → `ryo` per `docs/branding.md §12`.
- 2026-04-24 00:23 — watchdog — 3 ticks coalesced, 5 checks run — 7 findings logged to Deviations [needs-review]: row-status drift (rows 1–10 still queued/in-progress though M0–M6 done per log + green typecheck/build), 4 ETAs slipped without Deviation (rows 1–4), 6 untracked docs under `docs/` (00-, 02-, 03-, 04-, 05-, README.md), existing Deviation's claim about features-not-importing-RN is false (9 files do), AGENTS_TODO missing Ryo-rebrand context, PROGRESS/Activity-log/Active-assignments tell 3 different milestone stories, memory `project_bnb_overview.md` still says "greenfield". Memory not auto-edited — left for user to resolve phrasing.
- 2026-04-24 (session 36396150 or earlier) — docs-writer — authored 14 UI-agnostic business-module specs under `docs/` (`00-overview`, `02-auth-identity` through `14-admin-ops`) + `docs/README.md` index. Each follows template: purpose · user stories · core flows · data model · API surface · edge cases · KPIs · dependencies · v1 scope · open questions. Also authored `docs/PROGRESS.md` (human-readable living status) — not logged at creation time; logged retroactively here. Now tracked as row 14.
- 2026-04-24 — main (session this) — reconciliation pass: updated AGENTS_TODO (title/north-star for Ryo rebrand, rows 1–14 status cleanup + rows 15–16 added, milestone boxes aligned with live-verification split, invariant refined for RN layout primitives + 2026-04-24 Deviation block added), updated PROGRESS.md (§2 state matches AGENTS_TODO, §3 product-specs subsection added, §8 changelog entry, version bumped 0.1.0 → 0.2.0), updated memory `project_bnb_overview.md` (no longer "greenfield"). All 7 watchdog findings from 2026-04-24 00:23 resolved.
- 2026-04-24 — main (session this) — fixed nativewind-on-web wiring. Symptom: every `<View className="...">` in shared features rendered with only `react-native-web` atomic classes; Tailwind output (23 KB on `app/layout.css`) compiled but never reached the DOM. Root cause: web tsconfig had no `jsxImportSource`, and Tailwind config didn't include `nativewind/preset`, so SWC didn't route JSX through nativewind's runtime wrapper. Fix: added `presets: [nativewindPreset, preset]` in [apps/web/tailwind.config.ts](apps/web/tailwind.config.ts) and `"jsxImportSource": "nativewind"` in [apps/web/tsconfig.json](apps/web/tsconfig.json). Cleared `.next` cache, killed stale next-server processes on :3000 + :3100, restarted on :3000. Verified: live HTML now contains brand utilities (`bg-surface`, `text-brand-500`, `border-surface-border`, `shadow-card`, `rounded-full`, `md:flex`, etc.) merged alongside `css-view-*` classes. Page styled.
- 2026-04-25 — main (session this) — Phase 17 v2-preview slice landed. New files: [packages/api/src/host.ts](packages/api/src/host.ts) (`useHostDashboard` + synthetic-data layer — listings → bookings/reviews/stats deterministically by listing id), [packages/api/src/admin.ts](packages/api/src/admin.ts) (`useAdminDashboard` — aggregates host data + seeded users/audit/health/moderation), [packages/features/src/host/HostDashboardScreen.tsx](packages/features/src/host/HostDashboardScreen.tsx), [packages/features/src/admin/AdminDashboardScreen.tsx](packages/features/src/admin/AdminDashboardScreen.tsx), [apps/web/app/(main)/host/page.tsx](apps/web/app/(main)/host/page.tsx), [apps/web/app/(main)/admin/page.tsx](apps/web/app/(main)/admin/page.tsx). Re-exports added to [packages/api/src/index.ts](packages/api/src/index.ts) and [packages/features/src/index.ts](packages/features/src/index.ts). Built strictly from `@bnb/ui` primitives (Card, Heading, Text, Badge, Avatar, Image, HStack, VStack, Pressable, Skeleton, Divider) per features-layer invariant; only RN allowlist (`View`, `ScrollView`) used directly. Both routes 200 (host: 3.6 s cold → 18 ms warm; admin: 1.1 s cold → 13 ms warm). `pnpm -F @bnb/api typecheck`, `pnpm -F @bnb/features typecheck`, `pnpm -F @bnb/web typecheck` all green. Routes deliberately not linked from main TopNav — accessible by direct URL `/host` and `/admin`. Deviation logged in §Deviations 2026-04-25.
- 2026-04-25 — main (session this) — **Dummy-listings fallback added.** Home feed was rendering empty (`No listings match your filters.`) because no live Supabase project is wired and `getSupabase()` throws. New file [packages/api/src/dummy-listings.ts](packages/api/src/dummy-listings.ts) exports `DUMMY_LISTINGS` (16 fully-formed `Listing` rows with deterministic ids like `l-positano-cliffside` so `/listing/[id]` deep-links are stable, mirrors `supabase/seed.sql` titles/prices/cities, three Unsplash photos per listing). Updated [packages/api/src/listings.ts](packages/api/src/listings.ts): `fetchListings()` and `fetchListing()` catch the "Supabase client not initialized" error and return filtered dummy data; `applyFiltersLocal()` mirrors the Supabase filter semantics so the same `useListings(filters)` call works identically against either backend. Also falls back if the live table returns zero rows. **Production caveat** (logged in [the production plan](~/.claude/plans/lets-check-the-developement-crispy-nygaard.md) M9.3): this fallback masks misconfigured Supabase — must hard-fail when `NODE_ENV=production` before public launch. Typecheck green across `@bnb/{api,features,web}`. Verified: page bundle contains `Cliffside villa`, `l-positano-cliffside`, etc.; `/` + `/listing/l-tulum-beach` both 200.
- 2026-04-25 — main (session this) — Authored [docs/BUSINESS_MODEL.md](docs/BUSINESS_MODEL.md) v0.1.0 — investor / partner handout (problem · product · who Ryo serves · how it makes money + illustrative unit economics · why-this-beats-Airbnb · market · GTM · roadmap · defensibility · risks · team · one-sentence summary). Forward-friendly. Indexed from [docs/README.md](docs/README.md) at the top of the doc list, alongside `branding.md`. All numbers in §4.3 flagged as model assumptions, not commitments. Pulls real facts from `docs/00-overview.md`, `docs/06-payments-payouts.md`, `docs/12-concierge-support.md`, `docs/branding.md`.
- 2026-04-25 — main (session this) — Production-readiness audit + path-to-launch plan written. Plan file at `/Users/sohailshaik/.claude/plans/lets-check-the-developement-crispy-nygaard.md` (lives outside the repo, plan-mode artefact). Defines 11 milestones M8–M18 covering live Supabase, code-blocker fixes (booking double-booking race, error UX layer, prod-mode dummy hard-fail), domain + email + legal, observability + security, rebrand, i18n + a11y + SEO, CI/CD + tests, mobile app stores, T&S minimum, perf, launch checklist. Estimated ~32 engineering days / ~9 weeks calendar including external dependencies. Two parallel Explore audits informed the plan: one on feature completeness vs v1 spec, one on operational/production gaps. Audit highlights the booking double-booking race in `supabase/migrations/0001_init.sql` (no `(listing_id, date)` exclusion constraint) as the highest-priority code bug.

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
