# Welsh Motorhub documentation

Internal reference for how the product works in production. Start here, then drill into topic files.

## Who this is for

| Audience | Start with |
|----------|------------|
| **Dealers (share with yards)** | **[for-dealers.md](./for-dealers.md)** · **[dealer-pricing-sheet.md](./dealer-pricing-sheet.md)** |
| Founders / product | [product-and-ux.md](./product-and-ux.md) |
| Developers | [product-and-ux.md](./product-and-ux.md) + [../README.md](../README.md) |
| SEO / growth | [seo-and-content.md](./seo-and-content.md) → [../data/seo/README.md](../data/seo/README.md) |
| Ops / deploy | [../README.md](../README.md) deploy section + `vercel.env.example` |

## Document map

| Doc | What it covers |
|-----|----------------|
| **[for-dealers.md](./for-dealers.md)** | **Dealer-facing guide** (plain language; share with showroom staff) |
| **[dealer-pricing-sheet.md](./dealer-pricing-sheet.md)** | **Plans, free boosts per tier, add-on prices** (share before billing goes live) |
| [product-and-ux.md](./product-and-ux.md) | Buyer, dealer, and admin journeys; listing lifecycle; key UI behaviour |
| [seo-and-content.md](./seo-and-content.md) | SEO stack, hubs, duty, model stories, sitemap, crons |
| [../data/seo/README.md](../data/seo/README.md) | Production SEO checklist, env vars, cron setup |
| [search-console-and-sitemap.md](./search-console-and-sitemap.md) | GSC, sitemap submission |
| [images.md](./images.md) | Image storage, watermarks, OG images |
| [../data/duty-crsp/README.md](../data/duty-crsp/README.md) | CRSP import for duty calculator |
| [../services/seo-worker/README.md](../services/seo-worker/README.md) | Optional Go crawl worker |

## How to keep docs current

1. **One change = one line in the right file** — don’t duplicate long explanations; link instead.
2. **Product behaviour** → `product-and-ux.md`
3. **SEO / copy / URLs** → `seo-and-content.md` or `data/seo/README.md`
4. **Deploy / env** → root `README.md` + `vercel.env.example` comments
5. **Shipped features** — update the “What’s shipped” section in root `README.md` when you release something user-visible.

## Changelog (high level)

Track meaningful releases here or in GitHub Releases. Recent work (2026):

- Listing page: desktop gallery + sticky summary sidebar; denser specs/features layout
- Sold listings: hidden from search immediately; public page remains **7 days** for similar-stock enquiries
- Listing buyer stories: tied to each car’s **body type** (no SUV copy on sedans)
- SEO: plain vehicle H1 on listings; homepage “Buy Used and New Cars in Kenya”; dynamic sitemap
- Ops: Vercel Hobby = daily SEO cron only; login redirect no longer logged as error

See git log on `main` for exact commits.
