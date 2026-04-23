# bnb

Airbnb-concept app — universal (iOS, Android, responsive web) from one codebase.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Mobile:** Expo SDK 52 + Expo Router v4
- **Web:** Next.js 15 (App Router)
- **Styling:** NativeWind v4 + Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Data:** TanStack Query + Zustand + Zod

## Layout

```
apps/
  web/      Next.js (responsive web)
  mobile/   Expo (iOS + Android)
packages/
  ui/        Cross-platform primitives
  features/  Shared screens
  api/       Supabase client + hooks
  db/        Generated types
  config/    Shared tsconfig / tailwind / eslint
  utils/     Helpers
supabase/
  migrations/  SQL migrations
  seed.sql     Seed data
```

## Setup

```bash
pnpm install

# start Supabase locally (requires Docker Desktop running)
pnpm dlx supabase start
pnpm dlx supabase db reset     # applies migrations + seed

cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env.local
# fill NEXT_PUBLIC_SUPABASE_ANON_KEY and EXPO_PUBLIC_SUPABASE_ANON_KEY
# from the `supabase start` output

pnpm dev                        # runs web (http://localhost:3000) + mobile (Expo)
```

### Running individual apps

```bash
pnpm dev:web
pnpm dev:mobile                 # press i for iOS sim, a for Android emulator, w for web
```

## Dev tips

- Screens live in `packages/features/*` — write once, the route shims in `apps/web/app/*` and `apps/mobile/app/*` just import them.
- Only use primitives from `@bnb/ui` inside shared features. Don't import `next/*` or raw `react-native` there.
- Breakpoints: Tailwind `sm 640 / md 768 / lg 1024 / xl 1280`. Mobile layout below `md`; tablet/desktop above.
