-- CreateEnum
CREATE TYPE "BuyerRequestStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "buyer_requests" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "yearMin" INTEGER,
    "yearMax" INTEGER,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER NOT NULL,
    "bodyType" "BodyType",
    "fuelType" "FuelType",
    "transmission" "Transmission",
    "mileageMin" INTEGER,
    "mileageMax" INTEGER,
    "county" TEXT NOT NULL,
    "timeline" TEXT NOT NULL DEFAULT 'ASAP',
    "conditionPref" TEXT NOT NULL DEFAULT 'EITHER',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "consentWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "status" "BuyerRequestStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "offerClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buyer_requests_publicCode_key" ON "buyer_requests"("publicCode");

-- CreateIndex
CREATE INDEX "buyer_requests_status_expiresAt_idx" ON "buyer_requests"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "buyer_requests_county_status_idx" ON "buyer_requests"("county", "status");

-- CreateIndex
CREATE INDEX "buyer_requests_make_model_idx" ON "buyer_requests"("make", "model");

-- CreateIndex
CREATE INDEX "buyer_requests_createdAt_idx" ON "buyer_requests"("createdAt");

-- AddForeignKey
ALTER TABLE "buyer_requests" ADD CONSTRAINT "buyer_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
