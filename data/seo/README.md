# SEO data & automation

## Production setup (checklist)

### 1. Database migration

Migrations run automatically on each **Vercel deploy** (`scripts/migrate-deploy.sh` during build). You only need a manual run if deploy logs show a failed migration or you changed the DB outside deploy.

```bash
# From repo root, with production DATABASE_URL + Session pooler DIRECT_URL (:5432) in .env
npx prisma migrate deploy
# or
npm run db:deploy
```

Latest listing-SEO migration: `20260522120000_model_seo_guide_listing_seo` (`model_seo_guides` table, `LISTING_SEO` job type). If build logs already say “Migrations applied successfully”, production is up to date.

### 2. `CRON_SECRET` (required for SEO queue)

1. Generate a long random string (32+ chars).
2. **Vercel** → Project → Settings → Environment Variables → add `CRON_SECRET` for **Production** (and Preview if you test crons there).
3. Redeploy so serverless functions see the new value.

Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` (and `x-vercel-cron: 1`). Manual checks can use the query string or Bearer:

```bash
curl -sS "https://welshmotorhub.co.ke/api/cron/seo-jobs?secret=YOUR_CRON_SECRET"
# or
curl -sS -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://welshmotorhub.co.ke/api/cron/seo-jobs"
```

Expected JSON: `{ "ok": true, "processed": { ... } }` (may show zero jobs if the queue is empty).

### 3. Scheduled crons (`vercel.json`)

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/seo-monitor` | Daily 03:00 UTC | Enqueue crawl/GSC/audit batch + process up to 40 pending SEO jobs |
| `/api/cron/seo-jobs` | Manual / external | Drain queue only — **not** in `vercel.json` on Hobby (Vercel blocks sub-daily crons) |

On **Vercel Hobby**, only daily cron expressions deploy. A `*/15` schedule blocks the whole deployment. For faster queue processing, call `seo-jobs` from an external cron (e.g. cron-job.org) with `Authorization: Bearer CRON_SECRET`, or upgrade to Pro and re-add a 15-minute `seo-jobs` entry.

After changing `vercel.json`, push to `main` and confirm under **Vercel → Project → Cron Jobs** that entries validate on deploy.

### 4. Optional AI — `XAI_API_KEY`

Not required. Without it, templates and `model-wiki.json` still populate guides; the app does not error.

| Variable | Where | Notes |
|----------|--------|--------|
| `XAI_API_KEY` | Vercel → Production (server only) | xAI API key |
| `XAI_MODEL` | Optional | Default in code: `grok-2-latest` |

When set, queued `LISTING_SEO` jobs can upgrade model guides and fill very short listing descriptions (&lt;120 chars). Keys are never exposed to the browser.

### 5. Verify after a new listing

1. Publish a car (admin or portal).
2. Within ~24 hours the daily `seo-monitor` cron processes `LISTING_SEO`, or hit `/api/cron/seo-jobs` manually for immediate runs.
3. Admin SEO monitor (if enabled) shows recent jobs under recent queue activity.

Optional indexing env vars (see root `.env.example`): `GOOGLE_INDEXING_*`, `GSC_*`, `SEO_WORKER_URL`.

---

## Import duty calculator (`/duty`)

Programmatic SEO for the duty tool:

| Piece | Location |
|-------|----------|
| Hub metadata | `src/app/duty/layout.js` |
| Per-vehicle pages | `/duty/{make-model-trim-year}` from `duty_vehicles` CRSP table |
| Keyword clusters | `data/seo/duty-clusters.json` + hub entry in `keyword-clusters.json` |
| Listing “Related” links | `src/lib/seo-keyword-clusters.js` → model-specific `/duty/...` when make/model match |
| JSON-LD | `src/components/DutyJsonLd.js` (WebApplication + FAQPage + breadcrumbs) |
| On-page related links | `src/components/DutyRelatedSearches.js` |
| Sitemap | `/duty` priority 0.88 + all `duty_vehicles` slugs |

**Operational steps**

1. Import CRSP catalog: Admin → **Duty CRSP** or `npm run db:import-crsp -- data/duty-crsp/starter-catalog.csv` (creates `/duty/{slug}` URLs in sitemap).
2. Add high-intent rows to `data/seo/duty-clusters.json` when you add popular vehicles (match `dutyPath` to real slug from admin or `buildDutyVehicleSlug`).
3. Request indexing (optional): set `GOOGLE_INDEXING_ENABLED=1` + service account — same as listings; ping `/duty` and new slugs after large CRSP imports.
4. GSC: monitor queries like `import duty calculator`, `land cruiser duty kenya`; internal links from listings now surface duty URLs automatically.

---

## Keyword clusters (`keyword-clusters.json`)

Maps high-intent Kenyan search phrases to internal URLs (hubs, guides, showrooms). Used on listing pages for “Related searches”.

## Location showrooms (`location-hubs.json`)

Corridor pages at `/showrooms/{slug}` (e.g. Kiambu Road, Ngong Road).

## Model wiki (`model-wiki.json`)

Curated buyer-guide copy. On publish, rows are copied into `model_seo_guides` (DB). Optional AI upgrade runs via `LISTING_SEO` job when `XAI_API_KEY` is set.

## Listing SEO bot

When a car is published (`finalizeNewCarPublicSlug` / admin or portal create):

1. **Instant:** template model guide in DB, hub path revalidation, Google indexing request.
2. **Queued (`LISTING_SEO`):** optional Grok model guide + thin description fill, comparison page sync.

Process queue (pick one):

- **Vercel Cron** (Hobby): daily `/api/cron/seo-monitor` at 03:00 UTC processes the queue when `CRON_SECRET` is set.
- **Manual:** `GET https://welshmotorhub.co.ke/api/cron/seo-jobs?secret=YOUR_CRON_SECRET`
- **Bearer:** `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://welshmotorhub.co.ke/api/cron/seo-jobs`

Full SEO monitor (crawl, GSC, audit batch): `/api/cron/seo-monitor` daily at 03:00 UTC.

## Save-Data mode

Browsers with **Save-Data: on** get a cookie and lighter galleries (fewer thumbs, no adjacent preload, no mosaic). UX stays usable; less mobile bundle usage.
