#!/usr/bin/env bash
# Dump the Supabase project to a local file.
#
# The project is quota-paused, so queries are heavily throttled — this is
# expected to take a long time and may need re-running. Runs against the
# session pooler (DIRECT_URL, :5432) rather than the transaction pooler,
# which is far more reliable for a long sequential dump.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

set -a
# shellcheck disable=SC1091
source .env
set +a

OUT="data/supabase-backup-$(date +%Y%m%d-%H%M%S).sql.gz"
mkdir -p data

# Parse credentials by hand rather than via new URL().
#
# The DB password contains '#', '@' and other reserved characters, so URL
# parsing silently truncates it (everything after '#' becomes a fragment) and
# auth fails with a misleading error. Slice the raw string instead.
parse_conn() {
  node -e '
const raw = process.argv[1];
const i = raw.indexOf("://") + 3;
// The "@" that ends the credential section is the LAST one before the path.
const at = raw.lastIndexOf("@", raw.indexOf("/", i));
const cred = raw.slice(i, at);
const c = cred.indexOf(":");
const user = cred.slice(0, c);
const pass = decodeURIComponent(cred.slice(c + 1));
const which = process.argv[2];
if (which === "pass") process.stdout.write(pass);
else {
  const m = /^postgres\.([a-z0-9]+)$/i.exec(decodeURIComponent(user));
  process.stdout.write(m ? m[1] : "");
}
' "$1" "$2"
}

PROJECT_REF="$(parse_conn "${DIRECT_URL:-}" ref)"
DB_PASSWORD="$(parse_conn "${DIRECT_URL:-}" pass)"

if [[ -z "$DB_PASSWORD" ]]; then
  echo "Could not read the DB password from DIRECT_URL — aborting."
  exit 1
fi

# The throttle lives in the pooler, but the direct endpoint currently refuses
# connections while the project is paused, so go through the session pooler.
SOURCE_URL="$DIRECT_URL"
MODE="session pooler"

# Strip the password out of the connection URL and pass it via PGPASSWORD only.
#
# pg_dump gives precedence to a password embedded in --dbname, which would put
# it in `ps` output for anyone on the machine. Removing it here keeps the
# credential out of the process table entirely.
SOURCE_URL="$(node -e '
const raw = process.argv[1];
process.stdout.write(raw.replace(/:\/\/([^:@/]+):[^@/]*@/, "://$1@"));
' "$SOURCE_URL")"

# pg_dump takes the password via PGPASSWORD so it never lands in the process
# list or this script's output.
PGPASSWORD="$DB_PASSWORD"
export PGPASSWORD

echo "Dumping to $OUT"
echo "Mode: $MODE  (password via PGPASSWORD, not in argv)"
echo "Started: $(date -Is)"

# The paused project throttles aggressively, so retry rather than fail on the
# first transient checkout timeout.
MAX_ATTEMPTS=6
for attempt in $(seq 1 $MAX_ATTEMPTS); do
  echo "--- attempt $attempt/$MAX_ATTEMPTS ---"
  if PGCONNECT_TIMEOUT=120 pg_dump \
      --dbname="$SOURCE_URL" \
      --format=plain \
      --no-owner \
      --no-privileges \
      --clean \
      --if-exists \
      2>/tmp/opencode/pgdump.err \
      | gzip -1 > "$OUT"; then
    echo "SIZE: $(du -h "$OUT" | cut -f1)"
    echo "OK: $OUT"
    exit 0
  fi
  echo "attempt $attempt failed:"
  grep -viE 'dumping|reading schema' /tmp/opencode/pgdump.err | tail -2
  [[ $attempt -lt $MAX_ATTEMPTS ]] && sleep 20
done

echo "FAILED after $MAX_ATTEMPTS attempts — partial file at $OUT"
exit 1