# Search Console and sitemap

## Production: `publicSlug` / P2022 column missing

If logs show `The column cars.publicSlug does not exist`, the database is behind Prisma schema. Run migrations against **production** (`npx prisma migrate deploy` with `DIRECT_URL` / `DATABASE_URL` for prod), or paste `prisma/manual/car_public_slug_hotfix.sql` into Supabase SQL Editor and run once.

If you already applied the first migration that created **`public_slug`** (snake_case), the follow-up migration `20260516200000_fix_cars_publicslug_prisma_column_name` renames it to **`publicSlug`** to match Prisma’s camelCase columns on `cars`.

## Submit the sitemap

1. Open [Google Search Console](https://search.google.com/search-console) for the production property.
2. Go to **Sitemaps** and add: `https://<your-domain>/sitemap.xml` (see `src/app/robots.js` — `sitemap` uses your configured site origin).
3. After large URL changes (hubs, listing slugs, facets), use **URL Inspection** on a few sample URLs and **Request indexing** if needed.

## What we emit

- Static marketing pages, `/cars`, dealers, individual listings (canonical slug when `publicSlug` is set), dealer pages.
- Programmatic hubs: make, model, county, make+county, fuel/body/price facets under a make.

## Ops tips

- Monitor **Coverage** and **Sitemaps** reports for spikes in “Discovered / not indexed” after deploys.
- Listing URLs may still answer on the old `/cars/<cuid>` path but **308 redirect** to the slug when `publicSlug` exists (`src/app/cars/[id]/page.js`).

## Listing slugs (`publicSlug`)

After deploying the migration that adds `Car.publicSlug`, run once locally or in CI **using the session pooler** (recommended):

Set **`DIRECT_URL`** in `.env` — the Supabase **Session pooler URI on port 5432** (same URI used for `prisma migrate deploy`). Plain `DATABASE_URL` on **port 6543** often fails for this script from a laptop.

`npm run db:backfill-slugs` (loads `.env` then `.env.local`; prefers `DIRECT_URL` when set.)

New listings receive a slug automatically from the admin/portal/create/bulk APIs.
