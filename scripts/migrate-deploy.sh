#!/usr/bin/env bash
# Apply Prisma migrations to Supabase.
#
# Use the Session pooler (port 5432) or db.<ref>.supabase.co — NOT the transaction
# pooler (:6543 + pgbouncer). See .env.example and docs/database-migrations.md.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=""
if [[ -f .env ]]; then
  ENV_FILE=".env"
elif [[ -f .env.local ]]; then
  ENV_FILE=".env.local"
fi

if [[ -z "$ENV_FILE" ]]; then
  echo "ERROR: No .env or .env.local found."
  exit 1
fi

# Load vars without letting a stale shell DIRECT_URL override the file.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is missing in $ENV_FILE"
  exit 1
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

const direct = parse(configuredDirect);
const useConfigured =
  direct &&
  direct.hostname &&
  !direct.hostname.includes("pooler.supabase.com") &&
  direct.hostname.startsWith("db.") &&
  direct.port !== "6543";

if (useConfigured) {
  if (!direct.searchParams.has("sslmode")) {
    direct.searchParams.set("sslmode", "require");
  }
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

echo "Running prisma migrate deploy..."
if npx prisma migrate deploy --schema "$ROOT_DIR/prisma/schema.prisma"; then
  echo "Migrations applied successfully."
  exit 0
fi

echo ""
echo "================================================================="
echo "  migrate deploy failed (often P1001 on IPv6-only db.*.supabase.co)"
echo "================================================================="
echo ""
echo "Apply the pending SQL manually in Supabase → SQL Editor:"
echo "  $ROOT_DIR/prisma/manual/lead_user_id.sql"
echo ""
echo "Then fix DIRECT_URL in $ENV_FILE — use Session pooler (port 5432) from"
echo "Supabase Dashboard, NOT the transaction pooler on :6543."
echo ""
echo "Example shape (replace password):"
echo '  DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"'
echo ""
exit 1
