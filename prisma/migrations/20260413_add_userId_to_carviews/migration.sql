-- Add userId column to car_views table
ALTER TABLE "car_views" ADD COLUMN "userId" TEXT;

-- Add foreign key constraint
ALTER TABLE "car_views" ADD CONSTRAINT "car_views_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add index for faster queries
CREATE INDEX "car_views_userId_carId_viewedAt_idx" ON "car_views"("userId", "carId", "viewedAt");
