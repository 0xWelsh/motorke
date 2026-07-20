-- Add CarStatus enum and carStatus column to cars

CREATE TYPE "CarStatus" AS ENUM ('IN_YARD', 'WITH_OWNER', 'IN_TRANSIT', 'AT_PORT');

ALTER TABLE "cars"
  ADD COLUMN IF NOT EXISTS "carStatus" "CarStatus";
