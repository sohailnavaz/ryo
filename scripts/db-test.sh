#!/usr/bin/env bash
# Runs every supabase/tests/*.sql against the local database.
#
# Each test file wraps itself in BEGIN … ROLLBACK, creates its own fixtures, and
# RAISEs on any failed assertion. With `ON_ERROR_STOP=1`, a RAISE makes psql exit
# non-zero, so a failed assertion fails the run. Nothing persists (rollback), so the
# suite is repeatable against any migrated DB.
#
# Usage: scripts/db-test.sh            (uses the local Supabase DB URL)
#        DB_URL=… scripts/db-test.sh   (override, e.g. for CI)
set -euo pipefail

DB="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/supabase/tests"

if ! psql "$DB" -tAc 'select 1' >/dev/null 2>&1; then
  echo "✗ cannot reach the database at $DB"
  echo "  start it with: pnpm dlx supabase start"
  exit 1
fi

pass=0; fail=0; failed_files=()
for f in "$DIR"/*.sql; do
  [ -e "$f" ] || { echo "no test files in $DIR"; exit 1; }
  name="$(basename "$f")"
  if out="$(psql "$DB" -v ON_ERROR_STOP=1 -q -f "$f" 2>&1)"; then
    # Surface the PASS notices the test emitted.
    echo "$out" | grep -E 'PASS|✓' | sed "s/^.*NOTICE:  /  /" || true
    echo "✓ $name"
    pass=$((pass+1))
  else
    echo "✗ $name"
    echo "$out" | grep -E 'ERROR|FAIL' | sed 's/^/    /' | head -5
    fail=$((fail+1)); failed_files+=("$name")
  fi
done

echo
echo "──────────────────────────────────────"
echo "db tests: $pass passed, $fail failed"
if [ "$fail" -gt 0 ]; then
  printf '  failed: %s\n' "${failed_files[@]}"
  exit 1
fi
