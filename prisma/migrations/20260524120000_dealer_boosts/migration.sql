-- AlterTable
ALTER TABLE "cars" ADD COLUMN "hotBadgeUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "dealers" ADD COLUMN "dealerLiftUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "dealer_boost_balances" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "spotlight7d" INTEGER NOT NULL DEFAULT 0,
    "spotlight30d" INTEGER NOT NULL DEFAULT 0,
    "hotBadge7d" INTEGER NOT NULL DEFAULT 0,
    "dealerLift14d" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_boost_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_boost_events" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "carId" TEXT,
    "boostType" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'portal',
    "charged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_boost_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealer_boost_balances_dealerId_key" ON "dealer_boost_balances"("dealerId");

-- CreateIndex
CREATE INDEX "listing_boost_events_dealerId_createdAt_idx" ON "listing_boost_events"("dealerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "listing_boost_events_carId_idx" ON "listing_boost_events"("carId");

-- AddForeignKey
ALTER TABLE "dealer_boost_balances" ADD CONSTRAINT "dealer_boost_balances_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_boost_events" ADD CONSTRAINT "listing_boost_events_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_boost_events" ADD CONSTRAINT "listing_boost_events_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
