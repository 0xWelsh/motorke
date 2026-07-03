-- Add published + imageUrl to car_model_specs for public encyclopedia

ALTER TABLE "car_model_specs"
  ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
