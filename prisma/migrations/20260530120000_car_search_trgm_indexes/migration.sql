-- Speed up ILIKE '%query%' on make/model/variant (search suggestions + inventory text search).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "cars_make_trgm_idx"
  ON "cars" USING gin ("make" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "cars_model_trgm_idx"
  ON "cars" USING gin ("model" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "cars_variant_trgm_idx"
  ON "cars" USING gin ("variant" gin_trgm_ops);
