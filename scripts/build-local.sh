#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_LOCAL="$ROOT_DIR/.env.local"

if [[ ! -f "$ENV_LOCAL" ]]; then
  echo "Missing .env.local. Create it with a local DATABASE_URL first."
  exit 1
fi

# Load DATABASE_URL from .env.local so local builds do not point at remote databases.
set -a
source "$ENV_LOCAL"
set +a

LOCAL_DB_URL="${DATABASE_URL:-}"
if [[ -z "$LOCAL_DB_URL" ]]; then
  echo "DATABASE_URL is missing in .env.local."
  exit 1
fi

echo "Using local DATABASE_URL from .env.local"

echo "Syncing Prisma schema to local database..."
DATABASE_URL="$LOCAL_DB_URL" DIRECT_URL="$LOCAL_DB_URL" \
  npx prisma db push --skip-generate --accept-data-loss --schema "$ROOT_DIR/prisma/schema.prisma"

echo "Generating Prisma client..."
DATABASE_URL="$LOCAL_DB_URL" DIRECT_URL="$LOCAL_DB_URL" \
  npx prisma generate --schema "$ROOT_DIR/prisma/schema.prisma"

if [[ "${1:-}" == "--sync-only" ]]; then
  echo "Local database schema sync complete."
  exit 0
fi

echo "Running local build..."
DATABASE_URL="$LOCAL_DB_URL" DIRECT_URL="$LOCAL_DB_URL" \
  npx next build
