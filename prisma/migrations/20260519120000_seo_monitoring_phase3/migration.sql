-- CreateTable
CREATE TABLE "seo_audit_runs" (
    "id" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "summary" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_audit_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_crawl_runs" (
    "id" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'cron',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_crawl_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_crawl_entries" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "error" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "seo_crawl_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_gsc_syncs" (
    "id" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_gsc_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_gsc_rows" (
    "id" TEXT NOT NULL,
    "syncId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "seo_gsc_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seo_audit_runs_createdAt_idx" ON "seo_audit_runs"("createdAt");

-- CreateIndex
CREATE INDEX "seo_crawl_runs_createdAt_idx" ON "seo_crawl_runs"("createdAt");

-- CreateIndex
CREATE INDEX "seo_crawl_entries_runId_idx" ON "seo_crawl_entries"("runId");

-- CreateIndex
CREATE INDEX "seo_gsc_syncs_syncedAt_idx" ON "seo_gsc_syncs"("syncedAt");

-- CreateIndex
CREATE INDEX "seo_gsc_rows_syncId_dimension_idx" ON "seo_gsc_rows"("syncId", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "seo_gsc_rows_syncId_dimension_key_key" ON "seo_gsc_rows"("syncId", "dimension", "key");

-- AddForeignKey
ALTER TABLE "seo_crawl_entries" ADD CONSTRAINT "seo_crawl_entries_runId_fkey" FOREIGN KEY ("runId") REFERENCES "seo_crawl_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_gsc_rows" ADD CONSTRAINT "seo_gsc_rows_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "seo_gsc_syncs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
