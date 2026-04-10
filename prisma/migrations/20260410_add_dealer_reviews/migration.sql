-- Add buyer reviews for dealer trust and social proof
CREATE TABLE "dealer_reviews" (
  "id" TEXT NOT NULL,
  "dealerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dealer_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dealer_reviews_dealerId_userId_key" ON "dealer_reviews"("dealerId", "userId");
CREATE INDEX "dealer_reviews_dealerId_createdAt_idx" ON "dealer_reviews"("dealerId", "createdAt");
CREATE INDEX "dealer_reviews_rating_idx" ON "dealer_reviews"("rating");

ALTER TABLE "dealer_reviews"
ADD CONSTRAINT "dealer_reviews_dealerId_fkey"
FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dealer_reviews"
ADD CONSTRAINT "dealer_reviews_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
