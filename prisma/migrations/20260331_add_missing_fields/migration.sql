-- CreateEnum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "Drivetrain" AS ENUM ('FWD', 'RWD', 'AWD', 'FOURWD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to 'cars'
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "drivetrain" "Drivetrain" NOT NULL DEFAULT 'FWD';
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "badges" TEXT[];
