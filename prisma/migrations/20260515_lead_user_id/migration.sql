-- Link enquiries to signed-in buyers when available (guest leads keep userId NULL).
ALTER TABLE "leads" ADD COLUMN "userId" TEXT;

CREATE INDEX "leads_userId_createdAt_idx" ON "leads"("userId", "createdAt");

ALTER TABLE "leads" ADD CONSTRAINT "leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
