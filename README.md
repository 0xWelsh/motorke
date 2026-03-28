# Motorke 🚗
**Kenya's car marketplace — compare cars across dealerships**

Full-stack Next.js 14 platform. Buyers search, filter, and compare cars. Dealerships manage their own listings via a self-service portal. You control everything via an admin panel.

---

## Stack

| Layer      | Tech                              |
|------------|-----------------------------------|
| Framework  | Next.js 14 (App Router)           |
| Database   | PostgreSQL via Supabase           |
| ORM        | Prisma                            |
| Auth       | Custom session auth (no libraries)|
| Styling    | Tailwind CSS + Syne/Inter fonts   |
| Images     | Supabase Storage                  |
| Deployment | Vercel + Supabase (recommended)   |

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

After `node prisma/seed.js`:

| Email                        | Password       | Role   | Access    |
|------------------------------|----------------|--------|-----------|
| `admin@motorke.co.ke`        | `admin1234`    | Admin  | `/admin`  |
| `prestige@motorke.co.ke`     | `prestige123`  | Dealer | `/portal` |
| `savanna@motorke.co.ke`      | `savanna123`   | Dealer | `/portal` |
| `nakuru@motorke.co.ke`       | `nakuru123`    | Dealer | `/portal` |
| `coast@motorke.co.ke`        | `coast123`     | Dealer | `/portal` |
| `highland@motorke.co.ke`     | `highland123`  | Dealer | `/portal` |

**⚠️ Change all passwords before going to production.**

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
4. They log in → land on `/portal` → start adding cars immediately

---

## Deploy (Vercel + Supabase)

Set these env vars in Vercel:
```
DATABASE_URL               (Supabase Transaction Pooler, port 6543)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL        https://motorke.co.ke
```

Build command:
```
npx prisma generate && npx prisma migrate deploy && next build
```

---

## npm scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Visual DB browser
npm run db:reset     # ⚠️  Wipe + re-seed (dev only)
```

---

## Phase 2 roadmap

- [ ] M-Pesa listing fees (Daraja API)
- [ ] Swipeable image gallery on car detail
- [ ] Saved cars / buyer accounts
- [ ] Bulk CSV import for large dealerships
- [ ] Map view — dealers near you
- [ ] SEO landing pages ("Toyota Hilux Nairobi")
- [ ] Price drop alerts via email
- [ ] React Native mobile app
