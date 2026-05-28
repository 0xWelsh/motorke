-- AlterTable
ALTER TABLE "dealers" ADD COLUMN "buyerRequestPassUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "buyer_request_offers" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "buyerRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_request_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buyer_request_offers_dealerId_createdAt_idx" ON "buyer_request_offers"("dealerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_request_offers_dealerId_buyerRequestId_key" ON "buyer_request_offers"("dealerId", "buyerRequestId");

-- AddForeignKey
ALTER TABLE "buyer_request_offers" ADD CONSTRAINT "buyer_request_offers_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_request_offers" ADD CONSTRAINT "buyer_request_offers_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "buyer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
