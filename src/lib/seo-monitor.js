import { db } from "@/lib/db";
import { runSeoAudit } from "@/lib/seo-audit";
import { getLatestCrawlRun } from "@/lib/seo-crawl-monitor";
import { getLatestGscSync } from "@/lib/seo-gsc-sync";

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
  const [auditRun, crawlRun, gscSync, liveAudit] = await Promise.all([
    getLatestAuditRun(),
    getLatestCrawlRun(),
    getLatestGscSync(),
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
    config: {
      workerUrl: Boolean(process.env.SEO_WORKER_URL),
      gscEnabled:
        process.env.GSC_SYNC_ENABLED === "1" || process.env.GSC_SYNC_ENABLED === "true",
      gscSiteUrl: process.env.GSC_SITE_URL || null,
    },
  };
}

export async function runSeoMonitorPipeline() {
  const audit = await runSeoAudit();
  const auditRow = await persistSeoAuditRun(audit);

  const { runCrawlMonitor } = await import("@/lib/seo-crawl-monitor");
  const { syncGscToDatabase } = await import("@/lib/seo-gsc-sync");

  const crawl = await runCrawlMonitor();
  const gsc = await syncGscToDatabase();

  return {
    audit: { ok: audit.ok, id: auditRow?.id, summary: audit.summary },
    crawl,
    gsc,
  };
}
