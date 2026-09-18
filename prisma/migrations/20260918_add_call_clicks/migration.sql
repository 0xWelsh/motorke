-- Track call taps on car listings (lead-intent visibility, Phase 1).
ALTER TABLE "cars" ADD COLUMN "callClicks" INTEGER NOT NULL DEFAULT 0;
