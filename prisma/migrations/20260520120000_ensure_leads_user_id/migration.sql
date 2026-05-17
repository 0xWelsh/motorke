-- Idempotent: production may have skipped 20260515_lead_user_id (lexicographic order vs 20260515140000_*).
-- Safe to run multiple times.

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "leads_userId_createdAt_idx" ON "leads"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "leads_dealerId_createdAt_idx" ON "leads"("dealerId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_userId_fkey'
  ) THEN
    ALTER TABLE "leads"
      ADD CONSTRAINT "leads_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
