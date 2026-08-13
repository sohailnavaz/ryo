# Shipping the Ryo mobile app

The Expo app in `apps/mobile` shares every screen with web via `packages/features`, so
it is a real app, not a stub. As of this commit **it bundles cleanly** (verified with
`expo export` — 3,741 modules) after two build blockers were fixed:

1. **`react-native-worklets`** was missing — reanimated 3.16's babel plugin requires
   `react-native-worklets/plugin`. Added as a dependency.
2. **Metro package-exports** were off, so `@bnb/ui/nav` (and the other subpath exports)
   couldn't resolve. Enabled `unstable_enablePackageExports` in `metro.config.js`.

`eas.json` (build + submit profiles) is now present too.

## Run it locally (needs a Mac + Xcode for iOS, or Android Studio)

```bash
cd apps/mobile
cp ../../.env.example .env.local     # paste the Supabase URL + anon key
pnpm dev            # then press i (iOS sim) / a (Android) / w (web)
```

## Share an Android test build (no Play Store, no $25 account)

The fastest way to get the app onto a tester's Android phone is an EAS **preview
APK** you send as a link/QR. No Google Play account needed.

`eas` doesn't need a global install (that needs `sudo` on a default `/usr/local`
npm) — run it through `npx`:

```bash
cd apps/mobile
npx eas-cli@latest login    # free Expo account (browser or email+password)
npx eas-cli@latest init     # links the project; writes projectId into app.json
npx eas-cli@latest build --profile preview --platform android
```

The build runs in Expo's cloud (~10–15 min) and prints a **build-page URL + QR**.
Send it to testers → they open it on Android → **Install** → allow "unknown
sources" once. The APK bundles the native modules (image picker, maps, auth), so
unlike Expo Go everything works.

**Before building — fill the anon key**, or the app installs but can't reach the
backend: in `eas.json` → `build.preview.env`, replace
`REPLACE_WITH_SUPABASE_ANON_KEY` with the live anon key (Supabase → Settings →
API; it's public-safe). Also make sure the live DB has migrations applied + a few
listings so testers see content.

Caveats:
- **Maps on Android** need a Google Maps API key (`app.json` →
  `android.config.googleMaps.apiKey`). Without it the app runs but the map view is
  blank — non-blocking for a test.
- The preview APK points at your **live** Supabase, so testers share the real DB.
  Use a separate staging project if you want test data isolated.

> Prefer a plain `eas` command? Point npm at a user folder first, then install
> without sudo: `npm config set prefix ~/.npm-global` · add `~/.npm-global/bin` to
> PATH · `npm i -g eas-cli`.

## Build a real binary — the parts that need YOUR accounts

Store binaries are built in the cloud with EAS. This needs credentials only the owner
has; none of it can be done from a headless environment.

```bash
npm i -g eas-cli
eas login                                   # a free Expo account

# 1. A simulator/dev build to test on a device
eas build --profile development --platform ios

# 2. Production builds
eas build --profile production --platform ios       # needs an Apple Developer acct ($99/yr)
eas build --profile production --platform android   # needs a Google Play acct ($25 once)
```

Before the first production build:

1. **Fill `eas.json` → `build.production.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`** with the
   live project's anon (publishable) key. It ships as `EXPO_PUBLIC_*`, so it is meant to
   be public — but until it's set, the built app has no Supabase key and every network
   call fails silently. (The URL is already set.)
2. **Enable the Apple provider** in Supabase → Auth → Providers → Apple, and add the
   Service ID / key from the Apple Developer portal. The app already offers "Sign in with
   Apple" (required by App Store Guideline 4.8 because we offer Google) — native uses the
   OS sheet via `expo-apple-authentication`, web falls back to OAuth. Without the provider
   enabled the button returns a 400.
3. **Fill the placeholders in `eas.json` → `submit.production`:** `appleId`, `ascAppId`,
   `appleTeamId` (from App Store Connect) and a Play service-account JSON.

Then:

```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

## Done — the app is now submission-shaped

- ✅ **Identity is Ryo.** `app.json`: name **Ryo**, slug `ryo`, scheme `ryo`, version
  `1.0.0`, bundle id **`com.ryostays.app`** (iOS + Android). ⚠️ Confirm you want that
  bundle id before the first build — it's permanent once an app is created in the
  stores. Change it here if you own a different reverse-domain.
- ✅ **Real brand icon + splash** (`assets/icon.png`, `adaptive-icon.png`, `splash.png`)
  — terracotta field + the 旅 mark, cream splash. A designer can refine, but these ship.
- ✅ **Permissions declared** (`app.json` → iOS `infoPlist`, Android `permissions`):
  photo library + camera, with usage strings (needed for listing/profile media).
- ✅ **Native share** works (OS share sheet on device, Web Share/clipboard on web) —
  listing "Share" and trip-detail "Share this trip".
- ✅ **Sign in with Apple** wired (native OS sheet + web OAuth) — clears the App Store
  Guideline 4.8 blocker. Needs the Apple provider enabled in Supabase (see above).

## The parts only YOU can do (accounts + payment)

```bash
npm i -g eas-cli && eas login          # free Expo account
eas init                                # creates the project; paste its id into app.json → extra.eas.projectId
eas build --profile production --platform ios       # Apple Developer account, $99/yr
eas build --profile production --platform android   # Google Play account, $25 once
eas submit --profile production --platform ios      # fill eas.json → submit.production first
eas submit --profile production --platform android
```

You'll also provide, in the store consoles: app description, keywords, category,
support URL, a **privacy policy URL** (required by both stores — the web app has
`/legal` pages to point at), and screenshots (take them from a running device/sim).

## Still open (nice-to-have, not blockers)

- **Route coverage:** the phone app ships the guest core (home, listing, booking,
  trips, wishlists, profile). Host/admin/messaging are web-first — add mobile routes
  only if they're in scope for the phone.
- **Push notifications + deep links** — not yet configured.
- **A device smoke-test** — this environment has no iOS simulator, so the app is
  verified by a clean production bundle (`expo export`, 3.7k modules) but not yet run
  on a physical device. Do one `eas build --profile development` run and open it on your
  phone before submitting.
