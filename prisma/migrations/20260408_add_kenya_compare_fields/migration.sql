-- CreateEnum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "HybridBatteryTech" AS ENUM ('NIMH', 'LI_ION', 'OTHER', 'NA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add Kenyan comparison columns to cars
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "groundClearanceMm" INTEGER;
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "hybridBatteryTech" "HybridBatteryTech";
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "spareAvailability" INTEGER;
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "importEligibility" BOOLEAN;
