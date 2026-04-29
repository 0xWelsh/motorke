# Go Search Service (Shadow Mode)

This service mirrors the existing `/api/cars/search` behavior and is intended for staged migration.

## Endpoints

- `GET /healthz`
- `GET /search?q=<query>&limit=<n>`

Response shape matches the Next.js search API records:

```json
[
  {
    "id": "car_id",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2018,
    "price": 1850000,
    "engineCC": 1500,
    "fuelType": "PETROL",
    "image": "https://..."
  }
]
```

## Local run

```bash
cd services/go-search
go mod tidy
DATABASE_URL="postgresql://..." PORT=8081 go run .
```

## Rollout flags (configured in Next.js app)

- `GO_SEARCH_SERVICE_URL` - e.g. `http://127.0.0.1:8081`
- `GO_SEARCH_SHADOW_ENABLED` - `true` enables comparison logs, still returns Node results.
- `GO_SEARCH_SHADOW_SAMPLE_PERCENT` - sampling to limit load (0-100).
- `GO_SEARCH_TIMEOUT_MS` - fetch timeout from Next.js to Go service.
- `GO_SEARCH_LOG_MATCHES` - log both matches and mismatches.
- `GO_SEARCH_ACTIVE_ENABLED` - reserved for future cutover.

## Safety contract

1. Keep `GO_SEARCH_ACTIVE_ENABLED=false` during shadow validation.
2. Compare mismatch rate and latency from `[go-search-shadow]` logs.
3. Only move traffic once mismatch rate is consistently near zero.
