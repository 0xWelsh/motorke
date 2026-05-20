-- Model-level buyer guides (auto-filled when listings publish)
CREATE TABLE "model_seo_guides" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "paragraphs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "bullets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "source" TEXT NOT NULL DEFAULT 'template',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_seo_guides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "model_seo_guides_make_model_key" ON "model_seo_guides"("make", "model");

-- Async SEO work when cars are published
ALTER TYPE "SeoJobType" ADD VALUE IF NOT EXISTS 'LISTING_SEO';
