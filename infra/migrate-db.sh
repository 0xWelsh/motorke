#!/usr/bin/env bash
# Copy production data from Supabase into the VM's local Postgres.
#
# Run this ON the VM, after:
#   1. `docker compose up -d db`
#   2. `docker compose --profile tools run --rm migrate`   (schema)
#
# Usage:
#   export SOURCE_DATABASE_URL='postgresql://postgres.<ref>:<pw>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
#   bash infra/migrate-db.sh
#
# Use the DIRECT (non-pooler) URL if you have it. The pooler works for
# pg_dump, but direct is faster and avoids statement limits.
#
# The dump is data-only for the `public` schema. Schema comes from Prisma
# migrations; Supabase's auth/storage/extensions schemas and roles are
# deliberately excluded. The target database must be freshly migrated and
# empty, or the INSERTs will collide with existing rows.

set -euo pipefail
cd "$(dirname "$0")/.."

: "${SOURCE_DATABASE_URL:?set SOURCE_DATABASE_URL to the Supabase connection string}"

DUMP_DIR="data/db-migration"
mkdir -p "$DUMP_DIR"
DUMP="$DUMP_DIR/prod-public-data.sql"

if [[ -s "$DUMP" ]]; then
  echo "→ Reusing existing dump at $DUMP (delete it to re-dump)"
else
  echo "→ Dumping public-schema data from source (Postgres 17 client)"
  docker run --rm \
    -v "$PWD/$DUMP_DIR:/dump" \
    postgres:17-alpine \
    pg_dump "$SOURCE_DATABASE_URL" \
      --schema=public \
      --data-only \
      --no-owner \
      --no-privileges \
      --exclude-table='public."_prisma_migrations"' \
      --disable-triggers \
      -f /dump/prod-public-data.sql
  echo "✓ Dump written to $DUMP"
fi

echo "→ Restoring into the local database"
docker compose exec -T db sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < "$DUMP"

echo
echo "✓ Restore complete."
echo "  Verify:  docker compose exec -T db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB -c \"select count(*) from cars;\"'"
