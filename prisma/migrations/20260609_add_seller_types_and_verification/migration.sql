-- AlterEnum
-- This migration adds two values to an existing enum.
-- With PostgreSQL versions 10-13, this is not possible in a single migration step.
-- You can still execute this migration, but it will fail.
-- We recommend skipping the "up" redaction and using the Prisma Migrate resolve
-- command to mark this migration as rolled back in the database. Then re-run
-- migrations to see the proper sql for your postgres version.


-- CreateEnum
CREATE TYPE "DealerType" AS ENUM('DEALERSHIP', 'BROKER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');

-- AlterTable
ALTER TABLE "dealers" ADD COLUMN "type" "DealerType" NOT NULL DEFAULT 'BROKER',
ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN "verificationApprovedAt" TIMESTAMP(3),
ADD COLUMN "verificationApprovedBy" TEXT,
ADD COLUMN "verificationRejectionReason" TEXT;

-- Add indexes
CREATE INDEX "dealers_type_idx" ON "dealers"("type");
CREATE INDEX "dealers_verificationStatus_idx" ON "dealers"("verificationStatus");

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_requests_dealerId_submittedAt_idx" ON "verification_requests"("dealerId" DESC, "submittedAt" DESC);

-- CreateIndex
CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: mark verified dealers as DEALERSHIP type with VERIFIED status
UPDATE "dealers" 
SET "type" = 'DEALERSHIP', "verificationStatus" = 'VERIFIED', "verificationApprovedAt" = "createdAt"
WHERE "verified" = true;

-- Mark all brokers (verified = false) as UNVERIFIED
UPDATE "dealers"
SET "verificationStatus" = 'UNVERIFIED'
WHERE "verified" = false;
