-- Add phone and whatsapp to users, createdById to cars

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

ALTER TABLE "cars"
  ADD COLUMN IF NOT EXISTS "createdById" TEXT;

CREATE INDEX IF NOT EXISTS "cars_createdById_idx" ON "cars" ("createdById");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cars_createdById_fkey'
  ) THEN
    ALTER TABLE "cars"
      ADD CONSTRAINT "cars_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE SET NULL;
  END IF;
END $$;
