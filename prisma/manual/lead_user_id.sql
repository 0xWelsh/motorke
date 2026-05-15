-- Run in Supabase → SQL Editor if `npx prisma migrate deploy` cannot reach the DB.
-- Safe to run more than once (IF NOT EXISTS guards).

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
