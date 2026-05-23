# Motorke 🚗
**Kenya's car marketplace — compare cars across dealerships**

Motorke is **live in production** with real dealer inventory. Full-stack **Next.js** (App Router): buyers search, filter, and compare cars; dealerships manage listings through a **self-service portal**; operators use an **admin** panel.

---

## Stack

| Layer      | Tech                                      |
|------------|-------------------------------------------|
| Framework  | Next.js 16 (App Router), React 19         |
| Database   | PostgreSQL via Supabase                 |
| ORM        | Prisma                                    |
| Auth       | Custom session auth (plus optional Google link in schema) |
| Styling    | Tailwind CSS + Syne/Inter fonts           |
| Images     | Supabase Storage (processing via Sharp)   |
| Deployment | Vercel + Supabase (recommended)           |

---

## Quick start

```bash
git clone <your-repo> && cd motorke
npm install
cp .env.example .env.local      # fill in DATABASE_URL + Supabase keys
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

Open `http://localhost:3000`

---

## Seed accounts

After `node prisma/seed.js` (local or staging **only**):

| Email                        | Password       | Role   | Access    |
|------------------------------|----------------|--------|-----------|
| `admin@motorke.co.ke`        | `admin1234`    | Admin  | `/admin`  |
| `prestige@motorke.co.ke`     | `prestige123`  | Dealer | `/portal` |
| `savanna@motorke.co.ke`      | `savanna123`   | Dealer | `/portal` |
| `nakuru@motorke.co.ke`       | `nakuru123`    | Dealer | `/portal` |
| `coast@motorke.co.ke`        | `coast123`     | Dealer | `/portal` |
| `highland@motorke.co.ke`     | `highland123`  | Dealer | `/portal` |

**⚠️ Change all passwords before going to production.**

Production traffic uses **real dealers and listings** created through admin/portal — not the seed file.

---

## Supabase Storage setup

1. Supabase project → **Storage** → **New bucket**
2. Name: `car-images` · Toggle **Public** ON · Create
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

---

## Onboarding a real dealership

1. `/admin/dealers/new` — create the dealership
2. `/admin/users/new` — create their login, link to that dealership
3. Share `yoursite.co.ke/login` + their email + temp password
4. They log in → land on `/portal` → add cars (single listing or **bulk CSV**)

Use this same flow when **onboarding more dealers** as you scale marketing and partnerships.

---

## Deploy (Vercel + Supabase)

Use **`vercel.env.example`** as the import template: copy to `vercel.env` (gitignored), fill real values, then **Vercel → Settings → Environment Variables → Import** (or paste). Do not commit the filled file.

Set these env vars in Vercel (see the template for the full list):

```
DATABASE_URL               (Supabase Transaction Pooler, port 6543)
DIRECT_URL                 (Supabase direct connection for migrations, if used)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL        https://motorke.co.ke
```

**Build:** use `npm run build`, which runs `prisma migrate deploy`, `prisma generate`, and `next build` (see `package.json`). Alternatively:

```bash
npx prisma migrate deploy && npx prisma generate && npx next build
```

---

## npm scripts

```bash
npm run dev          # Dev server
npm run build        # Production build (migrate + generate + next build)
npm run build:local  # Local-safe build (forces Prisma sync against .env.local DATABASE_URL)
npm run db:migrate   # Run migrations
npm run db:push:local # Sync local DB schema from prisma/schema.prisma
npm run db:seed      # Seed database
npm run db:studio    # Visual DB browser
npm run db:reset     # ⚠️  Wipe + re-seed (dev only)
```

---

## Documentation

Full product, SEO, and ops docs live in **[docs/README.md](./docs/README.md)** (index). Start with:

- **[docs/for-dealers.md](./docs/for-dealers.md)** — **share with dealerships** (what the site does for them)
- **[docs/product-and-ux.md](./docs/product-and-ux.md)** — listings, sold grace, layouts, dealer/admin flows
- **[docs/seo-and-content.md](./docs/seo-and-content.md)** — hubs, sitemap, model stories, crons
- **[data/seo/README.md](./data/seo/README.md)** — production SEO env checklist

---

## What’s shipped (product)

**Buyers**

- Search, filters, typeahead suggestions, and listing browse (`/cars`)
- Car detail: desktop **gallery + sticky sidebar**, mobile-first contact bar, plain-vehicle **H1**, spec sheet, reviews, saved cars, compare
- **Sold listings:** drop out of search immediately; listing page stays up **7 days** with similar-stock messaging
- **Buyer stories** on listings tied to each car’s body type (sedan vs SUV, etc.)
- Side-by-side **compare** (`/compare`) with optional AI-assisted copy
- Map views (Leaflet), **import duty** (`/duty`), programmatic hubs and showrooms
- Account: saved cars, enquiries; watch alerts (email cron)
- Dynamic **sitemap.xml**, robots, PWA shell, legal/FAQ

**Dealers (`/portal`)**

- Inventory CRUD, bulk CSV, **mark sold / mark live**, leads, analytics

**Admin (`/admin`)**

- Dealers, users, cars, approvals, reviews, leads, SEO monitor, duty CRSP, metrics

---

## Roadmap (next)

- **M-Pesa (Daraja)** when paid dealer plans go live
- **Marketing scale:** dealer QR/showroom links, influencer landing pages (see docs)
- **React Native** or dedicated mobile app (optional)
- Ongoing: conversion polish, more verified dealers, analytics as traffic grows

The **Stripe** dependency and `stripeId` on subscriptions support a future card rail; **today** the portal explains early access without in-app checkout.
