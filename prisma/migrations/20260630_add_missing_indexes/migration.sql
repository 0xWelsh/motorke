-- Add missing indexes for query performance

-- CarImage table: every listing query joins on (carId, isPrimary)
CREATE INDEX IF NOT EXISTS "car_images_carId_isPrimary_idx"
  ON "car_images" ("carId", "isPrimary");

-- Car table: used in WHERE { featured: true } on homepage + API
CREATE INDEX IF NOT EXISTS "cars_featured_idx"
  ON "cars" ("featured");

-- Car table: used in ORDER BY views DESC on homepage trending + API
CREATE INDEX IF NOT EXISTS "cars_views_idx"
  ON "cars" ("views");

-- Car table: used in ORDER BY featuredWeight DESC on homepage + API
CREATE INDEX IF NOT EXISTS "cars_featuredWeight_idx"
  ON "cars" ("featuredWeight");

-- Car table: used in WHERE { spotlightUntil: { gt: now } } for active spotlights
CREATE INDEX IF NOT EXISTS "cars_spotlightUntil_idx"
  ON "cars" ("spotlightUntil");
