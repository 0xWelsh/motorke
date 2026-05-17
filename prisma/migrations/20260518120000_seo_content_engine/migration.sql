-- CreateEnum
CREATE TYPE "SeoContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SeoContentType" AS ENUM ('BLOG', 'COMPARISON', 'LANDING');

-- CreateTable
CREATE TABLE "search_query_logs" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "sessionKey" TEXT,
    "userId" TEXT,
    "resultCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_content_pages" (
    "id" TEXT NOT NULL,
    "type" "SeoContentType" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT,
    "meta" JSONB,
    "status" "SeoContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_content_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_query_logs_normalized_createdAt_idx" ON "search_query_logs"("normalized", "createdAt");

-- CreateIndex
CREATE INDEX "search_query_logs_createdAt_idx" ON "search_query_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "seo_content_pages_slug_key" ON "seo_content_pages"("slug");

-- CreateIndex
CREATE INDEX "seo_content_pages_type_status_idx" ON "seo_content_pages"("type", "status");
