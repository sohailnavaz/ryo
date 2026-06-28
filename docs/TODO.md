---
doc: TODO
purpose: Punchy, prioritised list of what's left to ship Ryo to a public web launch. Distilled from the production plan at ~/.claude/plans/lets-check-the-developement-crispy-nygaard.md
last_updated: 2026-06-28
---

# Ryo — TODO to production

> *Status at a glance:* code for the v1 guest flow has landed (M0–M6), three dashboards exist (`/`, `/account`, `/host`, `/admin`), the site styles correctly, dummy data renders out-of-the-box, and the repo is on GitHub. **What's left is everything around the code: live backend, domain, email, legal, observability, and the few remaining code blockers.**

---

## ✅ Status update — 2026-06-28 (read this first; the sections below predate it)

Much of the 2026-05-13 plan has since shipped. **What changed since this doc was written:**

- **All 8 client-side `*-store.ts` mocks → real Supabase tables + RLS** (migrations `0005`–`0016`): messaging, notifications, named wishlists, review-write (verified-stay gated), host calendar/payouts/KYC, incidents, admin moderation/audit/feature-flags, storage buckets, payments schema. Each hook uses real Supabase when signed in, store as the demo fallback. **Validated locally (`db reset` clean, typecheck + build green); migration `0015` independently validated against a throwaway Postgres.**
- **Worldwide search backend** — `places` table + `pg_trgm` `search_places()` RPC + GeoNames importer (`pnpm db:places`); curated 195-country / 861-city in-bundle fallback. (was 🟡 "client-side filter over dummy")
- **i18n — now real** (was 🟡 "strings hardcoded"): 7 languages (EN/ES/FR/DE/AR-RTL/ZH/JA), persisted locale + switcher, `<html lang/dir>`, wired into explore/search/account/footer/cookie/onboarding chrome.
- **SEO** — per-route metadata, dynamic listing metadata + `LodgingBusiness` JSON-LD, Organization/WebSite JSON-LD, OG image, sitemap/robots. (M13 SEO portion ✅)
- **Legal + consent** — `/legal/{privacy,terms,cookies,security}` + `/.well-known/security.txt` + granular cookie banner. (M10 legal + M18 security.txt ✅; copy still needs a legal review)
- **Misc done:** booking double-book lock, error/toast layer, sort controls, destination autocomplete, booking detail screen, account hub, host create/edit listing.

### The real remaining critical path (supersedes the sequencing further down)
1. 🔴 **Go live** — apply `0001`–`0016` to the live Supabase project + set Vercel env + drop preview mode. *Blocked on founder credentials.* Unblocks verifying everything.
2. 🔴 **Payments** — Stripe + Razorpay (checkout, webhooks, payouts, refunds). *Needs processor accounts.* Longest pole.
3. 🟡 **Make host/admin actions real-and-verified** + remove the `demo`-role bypass.
4. 🟡 **Transactional email** (Resend/SES) · **file-upload UI** (buckets exist) · **observability** (Sentry/PostHog) · **CI/CD + tests** (in progress) · **CSP**.
5. 🟡 **Guest profile/booking depth** (photo upload, real availability calendar, adults/children/pets, full price calc).
6. ⏳ **External:** domains · email provider · Apple/Google accounts · legal review · logo → `bnb→ryo` rename · mobile EAS build + store submit.

**Revised estimate:** ~4–6 engineering weeks to launchable + ~2 weeks external waits. Per-section detail below is from 2026-05-13 — cross-check against this block before trusting a checkbox.

---

## 🔍 Feature-completeness gap analysis vs Airbnb (2026-05-13)

> Audit triggered by: "no admin management side development started, and the client profile is also not complete."
> **Both correct *at the time*.** What existed was **views**, not **actions**. The host (13 screens) and admin (13 screens) portals rendered synthetic data beautifully but performed no mutations. **Update 2026-05-22:** the admin console's top-5 actions (suspend, approve, refund/cancel, resolve, toggle flag — plus review keep/remove) now perform real client-side mutations with reason-code + confirm + audit log (`packages/api/src/admin-store.ts`); they persist locally and reflect across the console but do not yet hit a backend. The guest profile still edits only a subset of fields. Below is the full benchmark against Airbnb's real surface area.

**The single biggest blocker underneath all of this: there is no live backend.** Auth, payments, persistence, file upload, email, and search are all mocked. Most "actions" below can't be truly built until [M8 live Supabase](#m8--live-supabase--first-preview-deploy--1-day) lands. Until then we can build the *UI + optimistic flows* against synthetic data, but they won't persist.

### A. Guest / client side — vs Airbnb "Account" + trip experience

**Profile / Account hub** — we have: name, language, currency. Airbnb has 8 sections; we're missing ~90%:
- [x] **Personal info** — legal name, preferred name, phone, city, country, **address, emergency contact** (email read-only). *(email-change still TODO)*
- [~] **Profile photo** — paste-a-URL editor live (persists to user_metadata + live header preview); drag-drop file upload still needs Storage (M8/M17)
- [x] **About you** — bio, work, languages (chip multi-select), **school, decade born, fun fact**. *(reviews-about-me / verification badges still TODO — need backend)*
- [~] **Login & security** — password-reset email wired; 2FA + sessions list + delete-account are placeholders
- [ ] **Payments & payouts** — saved cards, add/remove payment method, Ryo credit/wallet, transaction history, receipts
- [x] **Notifications** — email/push/SMS channel toggles + category granularity (account/policy, promotions) + quiet-hours toggle live
- [~] **Privacy & data** — client-side "download my data" (JSON) export live; full server-side GDPR/DPDPA export + delete + granular cookie prefs still TODO
- [ ] **Travel for work / referrals** (later)

**Guest booking experience:**
- [ ] Real date-range calendar with live availability (currently mock; M5 + M8)
- [ ] Guest breakdown — adults / children / infants / pets (currently single number)
- [ ] Real price calc — nightly + cleaning + service fee + taxes + length-of-stay discounts (currently approximated)
- [ ] Write a review after a completed stay + see "reviews about me"
- [ ] Guest ↔ host messaging (pre-booking inquiry + booking thread) — `docs/07-messaging.md`
- [ ] Wishlists as **named collections** (Airbnb has multiple named lists; we have one flat favourites set)
- [ ] Trip itinerary detail — check-in instructions, directions, host contact, receipt download, "get help"
- [ ] Real cancellation + refund flow honouring policy tiers (`docs/05-bookings.md §4.4`)
- [ ] Recently-viewed + personalised suggestions row
- [ ] In-app notification inbox
- [ ] Help center / contact support entry point

### B. Host side — turn the 13 view screens into a working host tool

All exist as read-only previews. Need real actions (most gated on M8):
- [x] **Create a listing** — single-page publish form (title/desc/type/space/location/price/amenities/photo-URL) → persists, appears on home feed. *(multi-step wizard + photo upload still TODO)*
- [x] **Edit listing** — full editable form (title/description/type/price/currency/beds/baths/guests/city/country/amenities) persisting via `useUpdateListing`; delete via `useDeleteListing` behind a `ConfirmModal`; signed-in hosts edit their own real listings, synthetic ids fall back to a read-only preview. Photo reorder/upload + re-moderation routing still TODO
- [ ] **Calendar management** — block/unblock dates, per-day price overrides, min/max stay, iCal import/export
- [ ] **Accept / decline booking requests** (for request-to-book listings)
- [ ] **Host-initiated cancellation** with penalty disclosure
- [ ] **Respond to reviews** (one reply per review)
- [ ] **Payout setup** — bank/UPI, tax info (PAN/GSTIN), statements, year-end docs
- [~] **Real earnings** — `useMyListings` is real; earnings still synthetic until real bookings flow through
- [ ] **Messaging** — unified guest inbox with templates
- [ ] **Performance insights** from real data (views, conversion, rank)
- [ ] **Host onboarding + KYC** — ID, selfie, address, property-right proof (`docs/02-auth-identity.md §4.3`)

### C. Admin / management side — turn 13 view screens into real ops tools

All display-only today. The console must actually *do* things (`docs/14-admin-ops.md §4` safety patterns: reason code + confirm + audit entry + undo window):
- [~] **User management** — suspend / reinstate **live** (reason code + confirm + audit, client-side store); role grant/revoke + impersonate still TODO
- [~] **Listing moderation** — approve / request-changes / reject **live** from the queue with reason + notes; re-moderation routing TODO
- [~] **Review moderation** — keep / remove flagged reviews **live**; inline edit-out still TODO
- [~] **Booking actions** — cancel + full refund **live** (reason code + audit); partial refund / credit / re-book / escalate still TODO
- [~] **Dispute / incident resolution** — assign + resolve **live** with reason code; richer comms log TODO
- [ ] **Finance** — real GMV/payout reconciliation, chargeback handling, adjustments ledger
- [x] **Feature flags** — toggle **live** (reason code + audit; emergency flags require a note). Per-user/region/% targeting still TODO
- [~] **Audit log** — now populated from real console actions (client-side store) in addition to seed; server-backed log lands with Supabase
- [ ] **Global search** — resolve a real email/booking/listing id to the live record
- [ ] **Staff auth** — SSO + mandatory 2FA, least-privilege roles, break-glass (`docs/14 §7`)
- [ ] **Concierge desk** — the unified inbox + authorised-action console (`docs/12 §8`) — the actual differentiator

### D. Backend / infra (unblocks A–C) — these gate everything above

These are the M8–M18 milestones already listed below. The new gap analysis doesn't change them, it *depends* on them:
- 🔴 **M8 live Supabase** — without this, no action in A/B/C can persist
- 🔴 **Real auth** (magic-link delivery + Google OAuth round-trip)
- 🔴 **Real payments** (Stripe + Razorpay) — v2 per `docs/06`
- 🔴 **File/image upload** (avatars, listing photos) — Supabase Storage
- 🔴 **Transactional email** (M10)
- 🟡 **i18n actually wired** (M13) — strings still hardcoded English
- 🟡 **Search backend** — full-text + geo (currently client-side filter over dummy data)

### Suggested sequencing for "make it real"

1. **M8 live Supabase** (1 day) — the keystone. Everything below needs it.
2. **Guest profile completion** (2–3 days) — personal info, photo upload, security, notifications. Highly visible, mostly client work once Storage + auth are live.
3. **Host: create + edit listing + calendar** (4–5 days) — the supply engine.
4. **Admin: wire the top-5 actions** (3 days) — suspend user, approve listing, refund booking, resolve incident, toggle flag. Turns the console from a poster into a tool.
5. **Real payments** (1–2 wk per processor) — v2.
6. Then messaging, reviews-write, named wishlists, notifications inbox.

**Honest estimate to "feature-complete vs Airbnb v1":** the backend keystone + A/B/C UI-with-real-actions is **~6–9 additional engineering weeks** on top of the M8–M18 infra work. The screens being done makes this *much* faster than it sounds — most of B and C is wiring existing views to real mutations.

---

## 🚀 Share the app with someone — Vercel preview deploy

You can give your uncle (or anyone) a public URL like `ryo-sohailnavaz.vercel.app` that works on phone, tablet, laptop, anywhere with internet. Takes ~2 minutes; doesn't need your computer running.

The repo is already prepared for this — `vercel.json` at the root sets the right monorepo build command + turns on `NEXT_PUBLIC_RYO_PREVIEW_MODE=1` so the deploy serves dummy listings (no Supabase needed yet).

### Steps

1. Go to <https://vercel.com/new>
2. Sign in with **GitHub** (use the same `sohailnavaz` account so it can see the repo)
3. Click **Import** next to `sohailnavaz/ryo`
4. On the configure screen:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** leave blank (repo root — `vercel.json` handles the rest)
   - Don't add any env vars — `vercel.json` already sets `NEXT_PUBLIC_RYO_PREVIEW_MODE`
5. Click **Deploy**. Wait ~2 minutes for the first build.
6. You'll get a URL like `ryo-sohailnavaz.vercel.app`. **That's the link to share with your uncle.**

Every future `git push` to `main` auto-deploys; pull-request branches get their own preview URLs.

### Once Supabase is wired (M8 below)

In Vercel: **Settings → Environment Variables** → add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then **delete** `NEXT_PUBLIC_RYO_PREVIEW_MODE` from `vercel.json` so the prod hard-fail rule kicks back in. Redeploy.

**Legend** · 🔴 blocker for any user-facing launch · 🟡 needed before public launch (closed-beta-ok without) · 🟢 polish · ⏳ external dependency (someone outside engineering has to act)

---

## You (founder) — do these in parallel with my engineering work

The fastest path is for these to happen in the background while I build:

- [ ] ⏳🔴 **Register domains** — `ryostays.com` (primary) + `ryo.stay` (product) + `ryo.co.in` (India market). Cloudflare or Namecheap. ~30 min, then ~24h DNS propagation.
- [ ] ⏳🔴 **Create a Supabase project** at supabase.com (free tier is fine for v1). Choose Mumbai (`ap-south-1`) for India launch. Once created, grab the **Project URL** and **anon public key** and paste them to me; I'll wire them in.
- [ ] ⏳🔴 **Open an Apple Developer account** — $99/year, 24–48h verification. Needed to ship iOS app.
- [ ] ⏳🔴 **Open a Google Play Console account** — $25 one-time, ~1 day verification.
- [ ] ⏳🟡 **Pick a transactional-email provider** — recommendation: **Resend** (~$0–20/mo at v1 volumes). Alternative: AWS SES. Reply with the choice and I'll set it up against `mail.ryostays.com`.
- [ ] ⏳🟡 **Subscribe to Iubenda or Termly** for auto-generated Terms / Privacy / Cookie policy (~$60–100/year). I'll wire the pages in once you confirm which.
- [ ] ⏳🟡 **Logo + wordmark** — once we have a real logo, the `bnb → Ryo` rename PR can land (it's currently blocked on this).
- [ ] ⏳🟡 **Revoke leaked GitHub tokens** at https://github.com/settings/tokens (4 of them, see chat). Make one new classic PAT with `repo` + `workflow` + `read:org` if you want clean future `gh` flows.

---

## Code / engineering — what I'll build

Ordered by dependency. Each is a PR-sized chunk with a verification step. ETAs assume one developer.

### M8 — Live Supabase + first preview deploy 🔴 (1 day)

- [ ] Provision Supabase project (staging + production)
- [ ] Apply `supabase/migrations/0001_init.sql` to both
- [ ] Seed staging with `supabase/seed.sql`
- [ ] Add Storage buckets (`listing_photos`, `avatars`) with RLS
- [ ] Wire env vars: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel (web) and EAS profiles (mobile)
- [ ] First Vercel preview deploy on a temporary `*.vercel.app` URL
- [ ] Magic-link sign-in delivers real email (Supabase's default sender is fine for now)

**Unblocks:** every visible-to-user verification, real auth, real bookings, M9+.

### M9 — Production-blocking bugs 🔴 (2 days)

- [ ] **9.1** Booking double-booking fix — new migration `0002_booking_locks.sql` adding `daterange` exclusion via `btree_gist`; wrap booking create in a transaction. Two concurrent bookings of the same dates → exactly one wins.
- [ ] **9.2** Error UX layer — `Toast` + `ErrorBoundary` primitives in `@bnb/ui`; wrap web + mobile shells; replace every `console.warn` in auth + booking with a real surfaced error.
- [ ] **9.3** Hard-fail dummy fallback when `NODE_ENV === 'production'`. Keep dummy in dev (it's what makes the demo work without Supabase).

**Unblocks:** safe-enough to expose to real users.

### M10 — Domain + transactional email + legal pages 🔴 (4–5 days)

- [ ] Configure DNS: web → Vercel; mail → Resend (or SES)
- [ ] SPF / DKIM / DMARC on `mail.ryostays.com`
- [ ] Minimum React Email templates: magic-link, booking-confirmed, booking-cancelled, receipt
- [ ] Wire `apps/web/app/api/booking/confirm/route.ts` server route to send the confirmation
- [ ] Set up `support@ryostays.com` inbound (shared inbox)
- [ ] Legal pages: `apps/web/app/legal/{terms,privacy,cookies}/page.tsx` + footer links + cookie-consent banner

**Unblocks:** legally shippable; users get real email; M15 mobile (App Store needs Privacy URL).

### M11 — Observability + security hardening 🟡 (2 days)

- [ ] Sentry (`@sentry/nextjs` + `sentry-expo`)
- [ ] PostHog for product analytics (signup, search, listing-view, booking-start, booking-confirm)
- [ ] Security headers in `apps/web/middleware.ts` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] Rate limit on booking-confirm (Upstash Redis)
- [ ] DOMPurify on listing description / review body when rich text lands
- [ ] ESLint rule forbidding `SUPABASE_SERVICE_ROLE` import in client bundles

### M12 — Rebrand `bnb → ryo` 🟡 (1 day, gated on logo) ⏳

- [ ] Package names `@bnb/*` → `@ryo/*`
- [ ] Root `package.json` name
- [ ] Expo `app.json` slug, scheme, bundle IDs (`com.ryo.app`)
- [ ] Deep-link scheme `bnb://` → `ryo://`
- [ ] README, page titles, branding strings
- [ ] Folder rename `/bnb` → `/ryo` (last step)

### M13 — i18n + accessibility + SEO 🟡 (5 days)

- [ ] `next-intl` (web) + `expo-localization` (mobile)
- [ ] Locale catalogues `packages/config/i18n/{en-IN,en-US,hi-IN}.json`
- [ ] Extract every UI string from `packages/features/src/**/*.tsx` to ICU keys
- [ ] Locale picker in footer; RTL plumbing ready
- [ ] `accessibilityLabel` on every interactive component; alt text on listing photos; 44 px tap targets; axe-core CI check
- [ ] Per-route `generateMetadata` (dynamic for listings); `robots.txt`; dynamic `sitemap.ts`; OG image generation via `next/og`

### M14 — CI/CD + automated tests 🟡 (3–4 days)

- [ ] GitHub Actions: install → lint → typecheck → next build → Playwright e2e
- [ ] Vercel auto-deploy: preview on PR, production on main
- [ ] Vitest + React Testing Library: unit tests for `@bnb/api` + `@bnb/utils` (≥60% line coverage)
- [ ] One Playwright happy-path e2e: sign-in → search → listing → book → trips
- [ ] Lighthouse CI thresholds (85 perf / 95 a11y / 95 SEO / 95 best-practices)

### M15 — Mobile app store readiness 🔴 (5 engineering days + ~2 weeks store review) ⏳

- [ ] EAS `eas.json` with `preview` + `production` profiles
- [ ] App icons + splash screens generated from the locked brand source
- [ ] iOS provisioning + Android keystore set up
- [ ] Store listings: description, screenshots, video, age rating
- [ ] Privacy nutrition labels (Apple) + Play Store policy
- [ ] TestFlight + Play Internal-Test track → external testers → production submit

### M16 — Trust / Safety / Support minimum 🟡 (2 days)

- [ ] `report a listing` and `report a review` API endpoints → email to `support@ryostays.com`
- [ ] `audit_log` table populated from concierge-grade actions
- [ ] Published SLA: chat <2 min / email <30 min
- [ ] One-page incident runbook for founder + first concierge hire

### M17 — Performance + image pipeline 🟢 (2 days)

- [ ] Replace direct Unsplash links with Supabase Storage (origin) + `next/image` (CDN)
- [ ] `packages/ui/src/Image.tsx` becomes a smart cross-platform wrapper
- [ ] Bundle analyser run; code-split `HomeScreen` / `ListingScreen`
- [ ] Lighthouse Performance ≥ 90 across `/`, `/search`, `/listing/[id]`

### M18 — Launch checklist 🔴 (3 days)

- [ ] `security.txt` at `/.well-known/security.txt`
- [ ] DPO + abuse contact emails published
- [ ] Status page (Better Stack)
- [ ] DR doc: Supabase daily backup, restore procedure, RPO/RTO
- [ ] Day-1 runbook (where to look in Sentry, how to comp a refund, how to escalate)
- [ ] **Remove or feature-flag** `/host` and `/admin` v2-preview routes — synthetic data must not ship to public

---

## Code-level items NOT on the milestone path (smaller, can land anytime)

- [x] Google OAuth button on `SignInScreen` — wired via `useSignInWithGoogle`, disabled in preview mode
- [x] Profile edit mode — name / language / currency editable; demo writes through to localStorage, real writes via `supabase.auth.updateUser`
- [x] Booking cancellation button on `/trips` — `useCancelBooking` mutation + 2-tap confirm + toast
- [ ] Phone verification flow (schema fields exist, no UI)
- [ ] Listing share button (icon present, no `onPress`)
- [ ] Sort controls on search (API supports `.order()`, UI doesn't expose)
- [ ] Destination autocomplete (plain text input today)
- [ ] Review submission flow (read-only display today; needs verified-stay gate)
- [ ] Booking detail screen at `/trips/[id]`

---

## Engineering rough total

| Bucket | Days |
|---|---|
| M8 — Live Supabase | 1 |
| M9 — Production blockers | 2 |
| M10 — Domain + email + legal | 5 |
| M11 — Observability + security | 2 |
| M12 — Rebrand | 1 |
| M13 — i18n + a11y + SEO | 5 |
| M14 — CI/CD + tests | 4 |
| M15 — Mobile app store (eng portion) | 5 |
| M16 — T&S / support minimum | 2 |
| M17 — Performance + images | 2 |
| M18 — Launch checklist | 3 |
| **Total** | **~32 engineering days** |

**Critical-path calendar time:** ~9 weeks including external-dependency waits (Apple/Google review ~2 weeks, DNS, legal review).

With one developer: ~7 calendar weeks at a steady pace.
With two: ~4–5 calendar weeks.

---

## What I can start right now (no external dependency)

While you handle the ⏳ items above, I can land:

1. **M9** (2 days) — booking race-condition fix + error UX + production dummy hard-fail
2. **Small code items** above — Google OAuth UI, profile edit, booking cancel, share button, sort controls (~1 day each)
3. **M11 partial** — security headers + ESLint guard (Sentry / PostHog need accounts you create)

Tell me which to pick up first.

---

## Source of truth

- Detailed plan with file paths + verification steps: `~/.claude/plans/lets-check-the-developement-crispy-nygaard.md`
- Module specs: `docs/00-overview.md` → `docs/14-admin-ops.md`
- Brand bible: `docs/branding.md`
- Coordination layer (current row statuses): `AGENTS_TODO.md`
- Human status doc: `docs/PROGRESS.md`
