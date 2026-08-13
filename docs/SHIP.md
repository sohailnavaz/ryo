# Ship Ryo — launch runbook

The code is ship-ready and verified (see **Pre-flight** below). Everything left
needs *your* accounts/secrets — this doc makes each step copy-paste.

Live Supabase project ref: **`mtldmawenkdebtchnocs`**

---

## Pre-flight — already verified ✅

- All **24 migrations apply cleanly from scratch** on a fresh Supabase (`supabase db reset`).
- **db-test suite** (ledger, notifications, security, sensitive, saved-searches) — 5/5 files pass.
- **`pnpm typecheck`** green (8/8) · **`pnpm --filter @bnb/web build`** green · **`expo export`** green.
- **PR #3** is `MERGEABLE` / `CLEAN`, 19 commits ahead of `main`, **0 behind** (no conflicts).

---

## 1. Merge the branch
```bash
gh auth switch --user sohailnavaz
gh pr merge 3 --squash --delete-branch=false   # or merge in the GitHub UI
```

## 2. Apply migrations to the live database
Needs the project's DB password (Supabase dashboard → Project Settings → Database).
```bash
supabase link --project-ref mtldmawenkdebtchnocs   # paste DB password when asked
supabase db push                                    # applies 0001–0024 in order
```
> Do **not** run `seed.sql` on production — that inserts 20 demo listings. Real
> hosts create their own. (Run it only if you want a populated demo site.)

## 3. Enable auth providers (Supabase dashboard → Authentication → Providers)
- **Apple** — required for the iOS app (Guideline 4.8). Add the Service ID + key
  from your Apple Developer account.
- **Google** — optional; enable only if you want the "Continue with Google" button
  (also set `NEXT_PUBLIC_RYO_GOOGLE_AUTH=1`).

## 4. Web deploy (Vercel)
Import the repo, root = `apps/web`, framework = Next.js. Set env vars:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mtldmawenkdebtchnocs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | live anon key (Supabase → API) |
| `NEXT_PUBLIC_SITE_URL` | your production URL (e.g. `https://ryo.app`) |
| `ANTHROPIC_API_KEY` | Anthropic key — powers **content translation** + concierge |
| `RESEND_API_KEY` | *(optional)* transactional emails (`packages/emails`) |
| `NEXT_PUBLIC_RYO_GOOGLE_AUTH` | `1` *(only if Google enabled in step 3)* |

> Leave `NEXT_PUBLIC_RYO_DEMO` **unset** in production (keeps demo sign-in off).
> `NEXT_PUBLIC_RYO_PREVIEW_MODE` should stay unset too.

Deploy. Then point Supabase → Authentication → URL Configuration → Site URL at
your production URL (so magic-link / OAuth redirects land correctly).

## 5. Payments — still in demo mode
Booking uses a mock payment. Before taking real money, wire a provider
(Razorpay/Stripe): add the merchant keys and replace the mock capture in the
booking flow. Ledger + payouts plumbing is already built (migrations 0014, 0018).

## 6. Mobile app (EAS) — needs Apple/Google accounts
```bash
cd apps/mobile
npm i -g eas-cli && eas login          # free Expo account
eas init                                # paste the project id into app.json → extra.eas.projectId
```
Fill `apps/mobile/eas.json`:
- `build.production.env.EXPO_PUBLIC_SUPABASE_ANON_KEY` → live anon key (currently a placeholder)
- `submit.production.ios` → `appleId`, `ascAppId`, `appleTeamId` (App Store Connect)
- `submit.production.android` → a Play service-account JSON
```bash
eas build --profile production --platform ios       # Apple Developer, $99/yr
eas build --profile production --platform android   # Google Play, $25 once
eas submit --profile production --platform ios
eas submit --profile production --platform android
```
Both stores also need: privacy-policy URL (the web `/legal` pages), screenshots,
description, category. See `docs/MOBILE.md`.

## 7. Post-deploy smoke checks
- Sign up → land on `/account`; a **Welcome** notification appears.
- Explore shows listings; category chips filter; language switch translates UI + (with the Anthropic key) listing content.
- Create a host listing with a photo upload; it appears on the home feed.
- `/admin/analytics` loads for a staff account (`update profiles set role='admin' where id=…`).
