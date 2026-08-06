# Applying migrations to the live project

Migrations `0005`–`0011` are verified locally but have **never been applied to the
live Supabase project** (`mtldmawenkdebtchnocs`). They must be, or the deployed admin
console has no spine, no ledger, and the demo-role / profiles-leak fixes are not live.

This needs a credential only the project owner holds — a Supabase access token and the
database password. An anon key (all this environment has) cannot run DDL.

## Option A — CLI (recommended, one time)

```bash
# 1. A personal access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxx

# 2. Link the repo to the live project (asks for the DB password once)
pnpm dlx supabase link --project-ref mtldmawenkdebtchnocs

# 3. Dry-run: see exactly what will run, in order
pnpm dlx supabase db push --dry-run

# 4. Apply
pnpm dlx supabase db push
```

`db push` runs only migrations the remote hasn't seen (0005–0011 here), in order, in a
transaction per file. It will NOT re-run 0001–0004.

## Option B — Dashboard (no CLI)

Supabase Dashboard → SQL Editor → paste each file `0005`…`0011` **in order**, run one
at a time. Stop if any errors; they are ordered and dependent.

## After applying — smoke test (2 min)

1. Sign in as a real account, promote it once in the SQL editor:
   `update profiles set role='admin' where id = (select id from auth.users where email='you@…');`
2. Open `/admin/users` — segments + facet counts render, emails are masked.
3. `/admin/audit` → **Verify chain** → "Chain intact".
4. As anon (logged out), confirm the leak is closed:
   `GET /rest/v1/profiles?select=id,role` → `permission denied for table profiles`.

## Rollback

All 0005–0011 are additive (new tables / columns / functions; grants tightened). The
only behavioural change to existing flows is 0011 gating booking/listing inserts on
`not is_suspended()` — if that ever needs reverting, drop those two policies and
recreate the originals from 0001. Nothing drops or rewrites existing data.
