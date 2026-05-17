# Motorke SEO worker (Go)

Phase 1.5 / Phase 3 crawler service. Runs **outside** Vercel (Railway, Fly, EC2).

## Stack

- **Fiber** — HTTP API
- **Colly** — crawl URLs, status codes, titles
- **Persistence** — crawl results are stored by the Next.js app (`/api/cron/seo-crawl` or `seo-monitor`), not in this service

## Run locally

```bash
cd services/seo-worker
go mod tidy
CRAWL_BASE_URL=https://welshmotorhub.co.ke go run ./cmd/server
```

Health: `GET http://localhost:8090/health`

Smoke crawl:

```bash
curl -X POST http://localhost:8090/crawl/site \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Env

| Variable | Description |
|----------|-------------|
| `PORT` | Default `8090` |
| `CRAWL_BASE_URL` | Site origin to resolve relative paths |
| `SEO_WORKER_SECRET` | Optional Bearer token for `/crawl` |

## Next.js integration

Set in Vercel:

```
SEO_WORKER_URL=https://your-seo-worker.example.com
SEO_WORKER_SECRET=...
```

Call from cron or admin later via `src/lib/seo-worker-client.js` (optional).
