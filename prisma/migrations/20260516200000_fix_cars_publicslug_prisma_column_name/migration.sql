DROP INDEX IF EXISTS "cars_public_slug_key";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cars' AND column_name = 'public_slug'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cars' AND column_name = 'publicSlug'
  ) THEN
    ALTER TABLE "cars" RENAME COLUMN "public_slug" TO "publicSlug";
  END IF;
END $$;

ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "publicSlug" TEXT;

DROP INDEX IF EXISTS "cars_publicSlug_key";
CREATE UNIQUE INDEX "cars_publicSlug_key" ON "cars"("publicSlug");
