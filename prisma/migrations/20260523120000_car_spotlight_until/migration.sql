-- Paid Spotlight boost: homepage placement + browse rank while active.
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "spotlightUntil" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "cars_spotlight_until_idx" ON "cars" ("spotlightUntil");
