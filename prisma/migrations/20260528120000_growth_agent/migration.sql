-- CreateEnum
CREATE TYPE "GrowthProspectStatus" AS ENUM ('DISCOVERED', 'CONTACT_COLLECTED', 'OUTREACH_PLANNED', 'CONTACTED', 'INTERESTED', 'ONBOARDED', 'DECLINED', 'DORMANT');

-- CreateEnum
CREATE TYPE "GrowthOutreachChannel" AS ENUM ('WHATSAPP', 'CALL', 'EMAIL', 'VISIT', 'SMS', 'OTHER');

-- CreateEnum
CREATE TYPE "GrowthOutreachStatus" AS ENUM ('PLANNED', 'SENT', 'REPLIED', 'NO_RESPONSE', 'BOUNCED', 'CANCELLED');

-- CreateTable
CREATE TABLE "growth_prospects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceUrl" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "location" TEXT,
    "county" TEXT NOT NULL DEFAULT 'Nairobi',
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" "GrowthProspectStatus" NOT NULL DEFAULT 'DISCOVERED',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "inventoryUrl" TEXT,
    "inventoryCount" INTEGER NOT NULL DEFAULT 0,
    "inventoryCountPrev" INTEGER,
    "inventoryCheckedAt" TIMESTAMP(3),
    "matchedDealerId" TEXT,
    "outreachCount" INTEGER NOT NULL DEFAULT 0,
    "lastOutreachAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_outreach_events" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "channel" "GrowthOutreachChannel" NOT NULL,
    "status" "GrowthOutreachStatus" NOT NULL DEFAULT 'PLANNED',
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "subject" TEXT,
    "body" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_outreach_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_inventory_snapshots" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "inventoryCount" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL DEFAULT 0,
    "rawNote" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_inventory_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_prospects_status_county_idx" ON "growth_prospects"("status", "county");

-- CreateIndex
CREATE INDEX "growth_prospects_matchedDealerId_idx" ON "growth_prospects"("matchedDealerId");

-- CreateIndex
CREATE INDEX "growth_prospects_phone_idx" ON "growth_prospects"("phone");

-- CreateIndex
CREATE INDEX "growth_prospects_createdAt_idx" ON "growth_prospects"("createdAt");

-- CreateIndex
CREATE INDEX "growth_outreach_events_prospectId_createdAt_idx" ON "growth_outreach_events"("prospectId", "createdAt");

-- CreateIndex
CREATE INDEX "growth_outreach_events_status_scheduledAt_idx" ON "growth_outreach_events"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "growth_inventory_snapshots_prospectId_capturedAt_idx" ON "growth_inventory_snapshots"("prospectId", "capturedAt");

-- AddForeignKey
ALTER TABLE "growth_prospects" ADD CONSTRAINT "growth_prospects_matchedDealerId_fkey" FOREIGN KEY ("matchedDealerId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_outreach_events" ADD CONSTRAINT "growth_outreach_events_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "growth_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_inventory_snapshots" ADD CONSTRAINT "growth_inventory_snapshots_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "growth_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
