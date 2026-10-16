#!/usr/bin/env bash
# Add `export const revalidate` to public pages that are safe to serve from the
# Vercel edge.
#
# Safety rules, enforced here rather than by hand:
#   - skip anything that reads searchParams (Next forces those dynamic anyway)
#   - skip anything that reads cookies()/headers() (could be user-specific)
#   - skip anything already exporting revalidate or dynamic
#   - skip /admin, /dashboard, /saved, /account, /requests and auth routes
set -euo pipefail

cd "$(dirname "$0")/.."

TARGETS="privacy safety sell mission report how-to-buy request-car trust faq terms kenya contact"
TTL="${TTL:-3600}"
ADDED=0; SKIPPED=0

for slug in $TARGETS; do
  f="src/app/$slug/page.js"
  [ -f "$f" ] || { echo "  skip /$slug (no page.js)"; SKIPPED=$((SKIPPED+1)); continue; }

  if grep -q 'searchParams' "$f"; then
    echo "  skip /$slug (searchParams → forced dynamic)"; SKIPPED=$((SKIPPED+1)); continue
  fi
  if grep -qE 'cookies\(|headers\(' "$f"; then
    echo "  skip /$slug (reads cookies/headers)"; SKIPPED=$((SKIPPED+1)); continue
  fi
  if grep -q 'export const revalidate' "$f"; then
    echo "  skip /$slug (already has revalidate)"; SKIPPED=$((SKIPPED+1)); continue
  fi
  if grep -q 'export const dynamic' "$f"; then
    echo "  skip /$slug (explicit dynamic — left alone)"; SKIPPED=$((SKIPPED+1)); continue
  fi
  # Client-component pages cannot carry route segment config, and prepending an
  # export above "use client" also breaks the directive. Skip both cases.
  if grep -q '"use client"' "$f"; then
    echo "  skip /$slug (client component — cannot set revalidate)"; SKIPPED=$((SKIPPED+1)); continue
  fi

  # `export const` is hoisted, so prepending is valid even above the imports.
  tmp="$(mktemp)"
  {
    echo "// Served from the Vercel edge; re-rendered at most every ${TTL}s."
    echo "// No searchParams or cookies on this route, so the output is cacheable."
    echo "export const revalidate = ${TTL};"
    echo
    cat "$f"
  } > "$tmp"
  mv "$tmp" "$f"
  echo "  + ISR /$slug (${TTL}s)"
  ADDED=$((ADDED+1))
done

echo "added=$ADDED skipped=$SKIPPED"