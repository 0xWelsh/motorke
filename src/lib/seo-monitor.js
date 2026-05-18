import { db } from "@/lib/db";
import { runSeoAudit } from "@/lib/seo-audit";
import { getLatestCrawlRun } from "@/lib/seo-crawl-monitor";
import { getLatestGscSync } from "@/lib/seo-gsc-sync";
import { getGscDailySeries } from "@/lib/seo-gsc-daily";
import { getLatestPageSpeedRuns } from "@/lib/seo-pagespeed";
import { getRecentSeoJobs } from "@/lib/seo-job-queue";

export async function persistSeoAuditRun(report) {
  try {
    return await db.seoAuditRun.create({
      data: {
        ok: report.ok,
        summary: report.summary,
        issues: report.issues || [],
      },
    });
  } catch {
    return null;
  }
}

export async function getLatestAuditRun() {
  try {
    return await db.seoAuditRun.findFirst({ orderBy: { createdAt: "desc" } });
  } catch {
    return null;
  }
}

/** Full monitor payload for admin UI / API. */
export async function getSeoMonitorDashboard() {
  const [auditRun, crawlRun, gscSync, gscDaily, pageSpeedRuns, recentJobs, liveAudit] =
    await Promise.all([
      getLatestAuditRun(),
      getLatestCrawlRun(),
      getLatestGscSync(),
      getGscDailySeries({ days: 28 }),
      getLatestPageSpeedRuns({ take: 6 }),
      getRecentSeoJobs({ take: 10 }),
      runSeoAudit().catch(() => null),
    ]);

  const gscQueries =
    gscSync?.rows?.filter((r) => r.dimension === "query").slice(0, 15) || [];
  const gscPages =
    gscSync?.rows?.filter((r) => r.dimension === "page").slice(0, 10) || [];

  const crawlFailures =
    crawlRun?.entries?.filter((e) => e.status >= 400 || e.error || e.status === 0) || [];

  return {
    liveAudit,
    auditRun,
    crawlRun,
    crawlFailures,
    gscSync,
    gscQueries,
    gscPages,
    gscDaily,
    pageSpeedRuns,
    recentJobs,
    config: {
      workerUrl: Boolean(process.env.SEO_WORKER_URL),
      gscEnabled:
        process.env.GSC_SYNC_ENABLED === "1" || process.env.GSC_SYNC_ENABLED === "true",
      gscSiteUrl: process.env.GSC_SITE_URL || null,
      pageSpeedEnabled: Boolean(process.env.GOOGLE_PAGESPEED_API_KEY?.trim()),
      alertsEnabled:
        process.env.SEO_ALERTS_ENABLED !== "0" && process.env.SEO_ALERTS_ENABLED !== "false",
      slackEnabled: Boolean(process.env.SLACK_WEBHOOK_URL?.trim()),
      jobQueue: "postgres",
    },
  };
}

export async function runSeoMonitorPipeline() {
  const { enqueueSeoMonitorBatch, processPendingSeoJobs } = await import(
    "@/lib/seo-job-queue"
  );

  const enqueued = await enqueueSeoMonitorBatch();
  const processed = await processPendingSeoJobs({ limit: 10 });

  return { enqueued, processed };
}
