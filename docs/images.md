# How car images work

This document exists because **on 2026-05-12 every car listing lost its
images for several hours**. The files were never gone. What broke was
the optimization pipeline routing every render through Vercel's image
optimizer, which silently 402'd once the Hobby-plan monthly quota was
exhausted. The fix was to skip Vercel's optimizer entirely.

This file pins the architecture in writing so future you doesn't undo
it by accident.

## The shape

1. **Origin**: dealers/admins upload via `POST /api/upload`. The route
   accepts JPG/PNG/WebP up to 8 MB, applies a watermark with
   `src/lib/watermark.js`, then stores the file in
   **Supabase Storage** in the `car-images` bucket at the path
   `cars/tmp-<userId>/<timestamp>-<index>.<ext>`. (Yes, the "tmp-"
   prefix is permanent today — see "Known cleanup" below.)

2. **URL**: the public URL returned by `uploadImage()` is saved to the
   `car_images.url` column verbatim:
   `https://<project-ref>.supabase.co/storage/v1/object/public/car-images/...`

3. **Render**: `src/components/SafeImage.js` wraps `next/image`. It
   handles `onError` gracefully (placeholder instead of broken icon)
   and emits an `image_load_failed` analytics event when a load fails
   so a future regression shows up in dashboards.

4. **Delivery**: `next.config.js` has `images.unoptimized: true`. That
   means `<Image>` renders as a plain `<img src="https://...">` with no
   `/_next/image` involvement. Supabase Storage already serves these
   over its own CDN with caching.

## Rules

- **Do not set `images.unoptimized: false` unless you have moved to a
  paid Vercel plan or routed images through Supabase's own image
  transformation endpoint** (see "If we ever want resized images"
  below). The Hobby plan optimizer quota is small enough that any
  marketplace with >50 listings × multiple photos will exhaust it.
- **Do not add new image hosts to a strict allowlist.** The current
  `remotePatterns` is wildcard HTTPS because uploads go through a
  server-side gate that already vets sources. Tightening this list
  silently breaks legacy listings whose URLs don't match.
- **Do not call `/_next/image` directly anywhere.** Use `<Image>` from
  `next/image` (or our `SafeImage` wrapper). If `unoptimized: true`
  it's a no-op; if someone flips it off, all rendering goes back
  through the optimizer.
- **Keep `images.dangerouslyAllowSVG: false`.** SVGs are scriptable
  and we have no use case requiring them.

## How we know things are healthy

- **`GET /api/health`** — public, fast. Returns 200 if DB, the
  Supabase bucket, and a sample image URL are all healthy. 503 if any
  one is degraded. Hook this up to UptimeRobot / BetterStack to get
  paged when something breaks.
- **`GET /api/admin/diagnostics/images?limit=N`** — admin-only.
  Scans the first N rows of `car_images`, reports which URLs are
  dead, surfaces the affected dealers/cars, and tells you whether
  the bucket itself is the problem.
- **Daily cron: `/api/cron/image-health`** (06:30 UTC). Samples 100
  recent images. If >10% fail OR the bucket is unreachable/private,
  emails the support inbox via `sendSystemAlertEmail`.
- **Client telemetry**: `SafeImage`'s `onError` fires
  `trackUiEvent("image_load_failed", { host, src_path, ... })`. Watch
  this in Plausible/GA when investigating regressions — a spike
  precedes any user complaint.
- **Service worker `public/sw.js`** never caches non-`ok` responses
  (`response.ok && response.type === "basic"`), so a transient 402
  or 503 doesn't get pinned in users' browsers. Bump the
  `CACHE_NAME` / `RUNTIME_CACHE` version any time the SW logic
  changes.

## If we ever want resized images

Right now we serve original-resolution photos. That's fine for most
listings (Supabase Storage compresses on the way out via standard CDN
encoding) but if/when we want explicit responsive variants:

1. Use **Supabase image transformations** (not Vercel's optimizer).
   Append `?width=400&height=300&resize=cover` to any storage URL on a
   project with image transformations enabled (free on Pro tier as of
   writing — check Supabase docs before relying on it).
2. Or write a custom `loader` for `next/image` that points at the
   Supabase transformation endpoint, and re-enable optimization. This
   keeps `<Image>` ergonomics without paying Vercel's image quota.
3. Document the new flow in this file and update the cron + health
   checks accordingly.

## Known cleanup (not blocking)

- `imagePath()` puts everything under `cars/tmp-<userId>/...`. The
  `tmp-` prefix was meant to be rewritten to `cars/<carId>/...` once
  the car was saved, but the move step was never wired up. All images
  live in `tmp-` folders permanently. The `car_images.url` rows point
  at those paths and work fine — the path is cosmetic. If you want
  to fix it, also write a migration that moves objects in Storage and
  updates DB URLs in one shot.
- Watermark is applied at upload time and is permanent on the file.
  We can't re-watermark old listings without re-uploading.
