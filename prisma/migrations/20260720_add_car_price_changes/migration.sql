-- CreateTable
CREATE TABLE "car_price_changes" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "oldPrice" INTEGER NOT NULL,
    "newPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "car_price_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "car_price_changes_carId_createdAt_idx" ON "car_price_changes"("carId", "createdAt");

-- AddForeignKey
ALTER TABLE "car_price_changes" ADD CONSTRAINT "car_price_changes_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
