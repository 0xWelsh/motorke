-- Drop the magazine feature column from gallery posts (feature removed).
-- Guarded: the gallery_posts table may not exist in all environments.
ALTER TABLE IF EXISTS "gallery_posts" DROP COLUMN IF EXISTS "magazineLink";
