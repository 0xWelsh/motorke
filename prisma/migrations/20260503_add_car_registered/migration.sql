-- Kenya registration status for listings
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "registered" BOOLEAN NOT NULL DEFAULT true;
