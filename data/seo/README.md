# SEO data & automation

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

Process queue: `GET /api/cron/seo-jobs?secret=CRON_SECRET` (same cron as other SEO jobs).

## Save-Data mode

Browsers with **Save-Data: on** get a cookie and lighter galleries (fewer thumbs, no adjacent preload, no mosaic). UX stays usable; less mobile bundle usage.
