# SEO and content

How discovery, metadata, and programmatic pages fit together. **Production checklist:** [../data/seo/README.md](../data/seo/README.md).

## URLs buyers and Google see

| Type | Pattern | Source |
|------|---------|--------|
| Listing | `/cars/{publicSlug-or-id}` | `src/lib/car-listing-url.js` |
| Make hub | `/cars/{make}` | Hub resolver |
| Make + model | `/cars/{make}/{model}` | Hub resolver |
| Global hubs | `/cars/hub/...` | `src/lib/seo-global-hubs.js` |
| Showrooms | `/showrooms/{slug}` | `data/seo/location-hubs.json` |
| Duty vehicle | `/duty/{slug}` | `duty_vehicles` table |
| Compare | `/compare/{slug}` | Generated comparison pages |
| Sitemap | `/sitemap.xml` | `src/app/sitemap.js` (dynamic) |
| Robots | `/robots.txt` | `src/app/robots.js` |

## Listing SEO

| Field | Rule |
|-------|------|
| Title | Year + make + model + “for Sale Kenya” + price snippet; site name via template |
| Meta description | Built in `buildCarListingDescription` |
| H1 (listing page) | Plain vehicle name only |
| H1 (hubs) | Can include “for sale” + location |
| Image alt | Generated on upload / `buildCarImageAlt` |
| Homepage title | “Buy Used and New Cars in Kenya” |

## Model buyer stories (listing page)

Three layers (first match wins if body type is compatible):

1. **DB** `model_seo_guides` (per make/model, from publish pipeline)
2. **Curated** `data/seo/model-wiki.json` (requires `bodyFamilies` match)
3. **Listing-tailored** template from actual car fields

**Important:** Guides seeded into DB must use the **listing’s body type**, not a hardcoded SUV. Pipeline: `ensureModelSeoGuide(make, model, car)` in `src/lib/car-seo-pipeline.js`.

### `model-wiki.json` fields

| Field | Purpose |
|-------|---------|
| `headline` | Section title base |
| `bodyFamilies` | `suv`, `sedan`, `hatch`, `wagon`, `mpv`, … — must match listing |
| `summary`, `specs`, `kenyaNotes`, `buyerTip` | Paragraphs |

Add new models here before relying on AI.

## Listing publish pipeline

On publish (`scheduleListingSeo` / `LISTING_SEO` job):

1. Template guide → DB (if missing)
2. Hub revalidation + optional Google indexing ping
3. Queue: optional Grok guide, thin description fill, comparison sync

**Cron (Vercel Hobby):** only **daily** `seo-monitor`; use manual `/api/cron/seo-jobs?secret=...` for faster queue drains.

## Duty SEO

See [../data/seo/README.md](../data/seo/README.md#import-duty-calculator-duty) and [../data/duty-crsp/README.md](../data/duty-crsp/README.md).

## Data files (edit by marketers/devs)

| File | Use |
|------|-----|
| `data/seo/keyword-clusters.json` | Related searches on listings |
| `data/seo/location-hubs.json` | Showroom corridor pages |
| `data/seo/model-wiki.json` | Curated buyer stories |
| `data/seo/duty-clusters.json` | Duty-related internal links |

## Search Console

Setup notes: [search-console-and-sitemap.md](./search-console-and-sitemap.md).

## Fixing wrong stories on live listings

1. Correct **body type** on the car in portal/admin.
2. If DB guide is wrong: delete row in `model_seo_guides` for that make/model, or wait for `LISTING_SEO` to regenerate with `XAI_API_KEY`.
3. Curated JSON: add/fix entry with correct `bodyFamilies`.
4. Redeploy not required for JSON/DB-only changes; revalidate listing path or wait for cache TTL (`car-detail` tag, ~120s).
