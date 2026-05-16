#!/usr/bin/env bash
# Apply Prisma migrations to Supabase.
#
# Use the Session pooler (port 5432) or db.<ref>.supabase.co — NOT the transaction
# pooler (:6543 + pgbouncer). See .env.example and docs/database-migrations.md.
#
# P1002 (advisory lock timeout) is common on Vercel + Supabase pooler when another
# deploy holds the lock or the pooler is slow. We retry with backoff, then on Vercel
# only we retry once with PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 (Prisma-supported).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Vercel/CI inject DATABASE_URL and DIRECT_URL — no .env file on the build machine.
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
elif [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set (add to .env locally or Vercel env vars)."
  exit 1
fi

# Local `next build` / CI compile check without touching the database (never set on production).
if [[ "${SKIP_PRISMA_MIGRATE_DEPLOY:-}" == "1" ]]; then
  echo "SKIP_PRISMA_MIGRATE_DEPLOY=1 — skipping prisma migrate deploy."
  exit 0
fi

MIGRATE_DIRECT_URL="$(
  node <<'NODE'
const databaseUrl = process.env.DATABASE_URL || "";
const configuredDirect = process.env.DIRECT_URL || "";

function parse(u) {
  try {
    return new URL(u.replace(/^postgresql:/, "postgres:"));
  } catch {
    return null;
  }
}

function projectRef(user) {
  const m = /^postgres\.([a-z0-9]+)$/i.exec(user || "");
  return m ? m[1] : null;
}

const db = parse(databaseUrl);
if (!db) {
  console.error("ERROR: DATABASE_URL is invalid");
  process.exit(1);
}

function ensureMigrateHints(u) {
  if (!u.searchParams.has("connect_timeout")) {
    u.searchParams.set("connect_timeout", "60");
  }
  return u;
}

const direct = parse(configuredDirect);
// Honour an explicit Session-pooler DIRECT_URL (Vercel / .env), not the :6543 transaction URL.
const useConfigured =
  direct &&
  direct.port === "5432" &&
  !direct.searchParams.has("pgbouncer");

if (useConfigured) {
  if (!direct.searchParams.has("sslmode")) {
    direct.searchParams.set("sslmode", "require");
  }
  ensureMigrateHints(direct);
  process.stderr.write(
    `Using configured DIRECT_URL (${direct.hostname}:5432).\n`
  );
  process.stdout.write(direct.toString().replace(/^postgres:/, "postgresql:"));
  process.exit(0);
}

// Default: Session pooler on :5432 (IPv4-friendly). Same host/user/password as DATABASE_URL.
const session = parse(databaseUrl);
session.port = "5432";
session.searchParams.delete("pgbouncer");
session.searchParams.delete("connection_limit");
session.searchParams.delete("pool_timeout");
if (!session.searchParams.has("sslmode")) {
  session.searchParams.set("sslmode", "require");
}
ensureMigrateHints(session);

const ref = projectRef(session.username);
process.stderr.write(
  `Using session pooler ${session.hostname}:5432 for migrations` +
    (ref ? ` (project ${ref})` : "") +
    ".\n"
);
process.stderr.write(
  "Tip: In Supabase → Project Settings → Database → Connection string, copy the Session pooler URI into DIRECT_URL in .env\n"
);
process.stdout.write(session.toString().replace(/^postgres:/, "postgresql:"));
NODE
)"

export DIRECT_URL="$MIGRATE_DIRECT_URL"

SCHEMA="$ROOT_DIR/prisma/schema.prisma"

is_p1002_lock_failure() {
  grep -qE 'P1002|advisory lock|pg_advisory_lock' <<<"${1:-}"
}

migrate_with_retries_and_vercel_fallback() {
  local out rc last_out

  run_migrate() {
    local use_disable="${1:-0}"
    set +e
    if [[ "$use_disable" == "1" ]]; then
      out="$(
        env PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 npx prisma migrate deploy --schema "$SCHEMA" 2>&1
      )"
    else
      out="$(npx prisma migrate deploy --schema "$SCHEMA" 2>&1)"
    fi
    rc=$?
    set -e
    printf '%s\n' "$out"
    last_out="$out"
    return "$rc"
  }

  # Vercel: Prisma can't extend the 10s advisory-lock wait; pooled Supabase often bumps P1002.
  # Do one normal migrate, then retry immediately with disable-lock (Prisma-supported workaround).
  if [[ "${VERCEL:-}" == "1" ]] && [[ "${MIGRATE_USE_POOLER_RETRY_LOOP:-}" != "1" ]]; then
    echo ""
    echo "prisma migrate deploy (Vercel primary)..."
    if run_migrate 0; then
      return 0
    fi
    if is_p1002_lock_failure "$last_out"; then
      echo ""
      echo "Vercel: P1002 — retry with PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1"
      echo "(see https://www.prisma.io/docs/orm/reference/environment-variables-reference)"
      if run_migrate 1; then
        return 0
      fi
    fi
    return "$rc"
  fi

  # Local CI or VERCEL+MIGRATE_USE_POOLER_RETRY_LOOP=1 — backoff retries, then Vercel disable-lock last resort.
  local max="${MIGRATE_DEPLOY_MAX_ATTEMPTS:-6}"
  local wait="${MIGRATE_DEPLOY_RETRY_WAIT_SECS:-18}"
  local i=1
  while (( i <= max )); do
    echo ""
    echo "prisma migrate deploy (attempt ${i}/${max})..."
    if run_migrate 0; then
      return 0
    fi

    if ! is_p1002_lock_failure "$last_out"; then
      return "$rc"
    fi

    if (( i == max )); then
      break
    fi
    echo ""
    echo "  -> P1002 / advisory lock (waiting ${wait}s before retry)."
    sleep "$wait"
    i=$((i + 1))
  done

  if [[ "${VERCEL:-}" == "1" ]] && is_p1002_lock_failure "$last_out"; then
    echo ""
    echo "Vercel: final retry with PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1"
    if run_migrate 1; then
      return 0
    fi
  fi

  return "$rc"
}

echo "Running prisma migrate deploy..."
if migrate_with_retries_and_vercel_fallback; then
  echo "Migrations applied successfully."
  exit 0
fi

echo ""
echo "================================================================="
echo "  migrate deploy failed"
echo "================================================================="
echo ""
echo "If you saw P3009 (failed migration recorded in _prisma_migrations):"
echo "  - Fix or align the DB schema (see prisma/manual/car_public_slug_hotfix.sql if relevant), then:"
echo "    npx prisma migrate resolve --rolled-back <failed_migration_folder_name>"
echo "    (or --applied if the SQL was applied manually and matches the migration file)"
echo "  - Re-run: npm run db:deploy"
echo ""
echo "If you saw P1002 (advisory lock):"
echo "  - Vercel builds retry migrate automatically with PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK — if both fail,"
echo "    add that env var in Vercel so the very first migrate attempt skips locking."
echo "  - Another deploy or local prisma migrate may still be holding Postgres busy — wait and redeploy."
echo "  - Or run prisma/manual/*.sql then: prisma migrate resolve --applied <migration_folder_name>"
echo ""
echo "Connection / pooler:"
echo "  - Use Session pooler DIRECT_URL on :5432 (not :6543 transaction mode)."
echo "  - Example: postgresql://postgres.<ref>:<pw>@aws-....pooler.supabase.com:5432/postgres?sslmode=require"
echo ""
exit 1
