# Welsh MotorHub Growth Agent (Go)

Dealer acquisition sidecar: discover yards, collect contacts, track outreach, monitor inventory, export CSV.

Runs **outside Vercel** (Railway, Fly, EC2) on port **8091** by default.

## Functions

| # | Function | API |
|---|----------|-----|
| 1 | Discover dealerships | `POST /discover/run` `{ "linkPlatformDealers": true, "prospects": [...] }` |
| 2 | Collect contacts | `POST /discover/ingest` or upsert via discover |
| 3 | Track outreach | `POST /prospects/:id/outreach` |
| 4 | Monitor inventory | `POST /monitor/inventory` (platform dealers with `matchedDealerId`) |
| 5 | Export leads | `GET /export/prospects.csv` · `GET /export/outreach.csv` |

## Deploy on Railway

Railway must deploy **this folder only**, not the repo root. If you deploy the root, Railway runs `npm run build` and fails with `DATABASE_URL is not set`.

### Setup

1. Railway → your project → **growth-agent service** → **Settings**
2. **Root Directory** → `services/growth-agent`
3. **Variables** (same Supabase DB as production):

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | Supabase transaction pooler (`:6543`, `pgbouncer=true`) |
   | `GROWTH_AGENT_SECRET` | Long random string (copy to Vercel too) |

4. **Networking** → **Generate domain** (service shows "Unexposed" until you do this)
5. Redeploy

Build uses the included `Dockerfile` + `railway.toml` (Go binary, not Next.js).

### Connect Vercel

```
GROWTH_AGENT_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app
GROWTH_AGENT_SECRET=same-as-railway
```

Redeploy Vercel, then open `/admin/growth`.

### Verify

```bash
curl https://YOUR-RAILWAY-DOMAIN/health
# {"ok":true,"service":"growth-agent"}
```

---

## Run locally

```bash
cd services/growth-agent
go mod tidy
DATABASE_URL="postgresql://..." GROWTH_AGENT_SECRET="dev-secret" go run ./cmd/server
```

Health: `GET http://localhost:8091/health`

## Auth

Set `GROWTH_AGENT_SECRET`. Requests need header `Authorization: Bearer <secret>` (or `?secret=` for manual tests).

## Discover

**Platform dealers** — imports unverified / inactive dealer rows already in your DB:

```bash
curl -X POST http://localhost:8091/discover/run \
  -H "Authorization: Bearer $GROWTH_AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"linkPlatformDealers": true}'
```

**External prospects** — bulk ingest (CSV pipeline, Google Maps export, manual research):

```bash
curl -X POST http://localhost:8091/discover/ingest \
  -H "Authorization: Bearer $GROWTH_AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "prospects": [{
      "name": "Example Motors",
      "county": "Nairobi",
      "phone": "254712345678",
      "whatsapp": "254712345678",
      "source": "google_maps",
      "notes": "SUV yard off Mombasa Rd"
    }]
  }'
```

Future: plug Google Places / Facebook scrapers into `/discover/run` — same ingest shape.

## Outreach

```bash
curl -X POST http://localhost:8091/prospects/PROSPECT_ID/outreach \
  -H "Authorization: Bearer $GROWTH_AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "WHATSAPP",
    "status": "SENT",
    "body": "Intro message sent",
    "createdBy": "admin-user-id"
  }'
```

Statuses: `DISCOVERED` → `CONTACT_COLLECTED` → `CONTACTED` → `INTERESTED` → `ONBOARDED` (set via `PATCH /prospects/:id`).

## Inventory monitor

For prospects linked to a platform dealer (`matchedDealerId`), counts live `cars.available` and stores snapshots + delta.

```bash
curl -X POST http://localhost:8091/monitor/inventory \
  -H "Authorization: Bearer $GROWTH_AGENT_SECRET"
```

Schedule nightly from Vercel cron → proxy to this endpoint (same pattern as seo-worker).

## Next.js admin proxy

When deployed, set in Vercel:

```
GROWTH_AGENT_URL=https://your-growth-agent.example.com
GROWTH_AGENT_SECRET=...
```

Admin-authenticated routes:

- `GET/POST /api/admin/growth-agent/...` → forwards to Go service

Example: download prospects CSV as admin:

`/api/admin/growth-agent/export/prospects.csv`

## Database

Uses the same Supabase Postgres as the main app. Tables:

- `growth_prospects`
- `growth_outreach_events`
- `growth_inventory_snapshots`

Apply migration: `npx prisma migrate deploy`

## Deploy checklist

1. Migrate DB
2. Deploy Go binary with `DATABASE_URL` + `GROWTH_AGENT_SECRET`
3. Set `GROWTH_AGENT_URL` on Vercel
4. Run `POST /discover/run` with `linkPlatformDealers: true` once
5. Cron `POST /monitor/inventory` daily
