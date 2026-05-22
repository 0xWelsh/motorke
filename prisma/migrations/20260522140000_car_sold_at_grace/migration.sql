-- AlterTable
ALTER TABLE "cars" ADD COLUMN "soldAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "cars_soldAt_idx" ON "cars"("soldAt");
