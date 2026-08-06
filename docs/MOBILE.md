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

Before the first production build, fill the placeholders in `eas.json` → `submit.production`:
`appleId`, `ascAppId`, `appleTeamId` (from App Store Connect) and a Play service-account
JSON. Then:

```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

## Still open for a polished store release

- **App identity is still `bnb`** (`app.json` name/slug/bundle id `com.navazshaik.bnb`).
  Rename to Ryo as part of the `bnb → ryo` migration ([branding §12](./branding.md)).
- **Icon + splash** are the Expo defaults — replace with the real brand assets.
- **Route coverage:** mobile currently ships the guest core (home, listing, booking,
  trips, wishlists, profile). Host/admin/messaging are web-first; add mobile routes if
  they're in scope for the phone app.
- **Push notifications, deep links** — not yet configured.
- Smoke-test on a physical device before submitting.
