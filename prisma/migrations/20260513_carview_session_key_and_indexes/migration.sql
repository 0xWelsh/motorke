-- Adds a per-device dedup key + helpful indexes for car-view tracking.
ALTER TABLE "car_views" ADD COLUMN IF NOT EXISTS "sessionKey" TEXT;

CREATE INDEX IF NOT EXISTS "car_views_sessionKey_carId_viewedAt_idx"
  ON "car_views" ("sessionKey", "carId", "viewedAt");

CREATE INDEX IF NOT EXISTS "car_views_carId_viewedAt_idx"
  ON "car_views" ("carId", "viewedAt");
