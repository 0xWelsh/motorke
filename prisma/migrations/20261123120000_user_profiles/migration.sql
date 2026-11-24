-- User profiles: handle, banner, bio, contact fields, public toggle, verification.
-- Written idempotently (IF NOT EXISTS / guarded CREATE TYPE) so it applies
-- cleanly to both fully-migrated and drifted databases.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED','PENDING','VERIFIED','SUSPENDED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "handle" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "locationLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "publicProfile" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "verificationRejectionReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_handle_key" ON "users"("handle");

-- Backfill handles from names (unique-ified); users without a name keep NULL.
DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  n INT;
BEGIN
  FOR r IN SELECT id, name FROM "users" WHERE handle IS NULL AND name IS NOT NULL AND length(trim(name)) > 1 LOOP
    base := lower(btrim(regexp_replace(r.name, '[^a-zA-Z0-9]+', '-', 'g'), '-'));
    base := left(base, 24);
    IF base ~ '^[0-9]' THEN base := 'u-' || base; END IF;
    IF base = '' THEN CONTINUE; END IF;
    candidate := base;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM "users" u WHERE u.handle = candidate) LOOP
      n := n + 1;
      candidate := left(base, 20) || '-' || n;
    END LOOP;
    UPDATE "users" SET handle = candidate WHERE id = r.id;
  END LOOP;
END $$;
