# Product and UX

How BIDGARI behaves for buyers, dealers, and admins. Code paths are pointers for developers.

## Site map (roles)

| Area | URL prefix | Auth |
|------|------------|------|
| Public marketplace | `/`, `/cars`, `/cars/[id]`, `/compare`, `/duty`, `/dealers`, `/showrooms/...` | Open |
| Dealer portal | `/portal` | Dealer session |
| Admin | `/admin` | Admin session |
| Account | `/account`, `/saved` | Buyer session |

## Buyer journey

1. **Discover** — Home, `/cars` search/filters, map, hubs (`/cars/hub/...`), showrooms (`/showrooms/{slug}`).
2. **Listing detail** — `/cars/{id-or-slug}`: gallery, price, dealer, specs, features, reviews, enquiry, WhatsApp/call.
3. **Compare** — Up to three cars on `/compare`; optional AI hints (needs API key).
4. **Duty** — `/duty` calculator + per-vehicle duty landing pages from CRSP data.
5. **Account** — Saved cars, enquiries, location for “nearby” features.

### Listing detail page (layout)

- **Mobile:** Gallery → title/price → content → enquiry; fixed bottom contact bar.
- **Desktop (lg+):** 8-column main (gallery, description, specs, features, wiki, similar, reviews) + 4-column **sticky** sidebar (H1, price, dealer, chips, contact, enquiry, compare).
- **H1:** Vehicle name only (e.g. `2019 Toyota Harrier`), not “for sale in …” — sale context lives on hub/SEO pages.
- **Gallery:** Slideshow for 5+ images (not mosaic collage on desktop).

### Sold cars (buyer-visible)

| Phase | Search / browse | Listing URL | Enquiry |
|-------|-----------------|-------------|---------|
| Live | Shown | Works | Yes |
| Marked sold | **Hidden** | Works for **7 days** | Yes |
| After 7 days | Hidden | 404 | No |

- Banner on sold listings: explains unit is sold; points to **similar cars** and dealer contact.
- Logic: `src/lib/car-sold-status.js`, `soldAt` on `Car` model.

### Buyer stories (under listing)

Section: **CarModelWiki** on listing page.

- Always opens with **this listing’s** year, body type, fuel, engine (e.g. sedan vs SUV).
- Curated copy from `data/seo/model-wiki.json` only if `bodyFamilies` matches listing `bodyType`.
- DB guides (`model_seo_guides`) skipped when text implies wrong body class.
- Resolver: `src/lib/seo-model-wiki.js` → `resolveModelWikiForCar(car)`.

**Dealer responsibility:** Body type on the listing form must be correct, or stories and filters will be wrong.

## Dealer journey

1. Login → `/portal` dashboard.
2. **Inventory** — `/portal/inventory`: add/edit, bulk CSV, filters (Live / Sold).
3. **Mark sold** — Toggles `available: false`, sets `soldAt`. Shows “public page for N more days”.
4. **Mark live** — Clears `soldAt`, returns to search.
5. Leads, analytics, profile, subscription messaging.

API: `POST /api/portal/cars/{id}/status` (dealer; admin also allowed).

## Admin journey

- Dealers, users, cars (including bulk), approvals, reviews, leads, traffic, SEO monitor, duty CRSP import.
- Same **mark sold / live** as dealers via `POST /api/admin/cars/{id}/toggle-visibility`.

## Copy and tone

- Public copy avoids heavy em-dash / middle-dot “AI punctuation”; titles use `|` where needed.
- Listing fallback description is neutral (no generic “150-point inspection” boilerplate).

## Key libraries

| Concern | Module |
|---------|--------|
| Listing SEO titles/H1/alt | `src/lib/car-listing-seo.js` |
| Sold grace | `src/lib/car-sold-status.js`, `src/lib/set-car-availability.js` |
| Model stories | `src/lib/seo-model-wiki.js` |
| Revalidation after edit | `src/lib/revalidate-inventory.js` |
| Maps / pins | `src/lib/map-pin.js`, `src/lib/geocode.js` |

## Tests worth running

```bash
npm test -- __tests__/car-sold-status.test.js
npm test -- __tests__/seo-model-wiki.test.js
npm run build
```
