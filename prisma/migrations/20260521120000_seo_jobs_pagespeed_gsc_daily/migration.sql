-- CreateEnum
CREATE TYPE "SeoJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "SeoJobType" AS ENUM ('CRAWL', 'GSC_SYNC', 'GSC_DAILY', 'PAGESPEED', 'AUDIT', 'CONTENT_SYNC');

-- CreateTable
CREATE TABLE "seo_jobs" (
    "id" TEXT NOT NULL,
    "type" "SeoJobType" NOT NULL,
    "status" "SeoJobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_gsc_daily_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_gsc_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_pagespeed_runs" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "performance" INTEGER,
    "accessibility" INTEGER,
    "bestPractices" INTEGER,
    "seoScore" INTEGER,
    "lcpMs" DOUBLE PRECISION,
    "fcpMs" DOUBLE PRECISION,
    "cls" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_pagespeed_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seo_jobs_status_scheduledAt_idx" ON "seo_jobs"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "seo_jobs_type_createdAt_idx" ON "seo_jobs"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "seo_gsc_daily_metrics_date_key" ON "seo_gsc_daily_metrics"("date");

-- CreateIndex
CREATE INDEX "seo_gsc_daily_metrics_date_idx" ON "seo_gsc_daily_metrics"("date");

-- CreateIndex
CREATE INDEX "seo_pagespeed_runs_url_strategy_createdAt_idx" ON "seo_pagespeed_runs"("url", "strategy", "createdAt");
