-- Private seller listings: moderation enum + PRIVATE dealer type + Car.listingStatus.
-- Idempotent; applied by the deploy workflow via `prisma db execute`.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ListingStatus" AS ENUM ('PENDING_REVIEW','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterEnum — guarded: some databases predate the DealerType enum entirely.
-- (PG12+: adding a value is safe as long as we don't use it in this script.)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealerType') THEN
    ALTER TYPE "DealerType" ADD VALUE IF NOT EXISTS 'PRIVATE';
  ELSE
    CREATE TYPE "DealerType" AS ENUM ('DEALERSHIP','BROKER','PRIVATE');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "listingStatus" "ListingStatus";
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
