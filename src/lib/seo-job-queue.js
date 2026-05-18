import { db } from "@/lib/db";
import { runSeoAudit } from "@/lib/seo-audit";
import { runCrawlMonitor } from "@/lib/seo-crawl-monitor";
import { syncGscToDatabase } from "@/lib/seo-gsc-sync";
import { syncGscDailyMetrics } from "@/lib/seo-gsc-daily";
import { runPageSpeedSuite } from "@/lib/seo-pagespeed";
import { syncComparisonPagesFromInventory } from "@/lib/seo-comparison-generator";
import { alertAuditIssues, alertCrawlFailure } from "@/lib/seo-alerts";

const MONITOR_JOB_TYPES = [
  "CRAWL",
  "GSC_SYNC",
  "GSC_DAILY",
  "PAGESPEED",
  "AUDIT",
  "CONTENT_SYNC",
];

/** Postgres-backed job queue (no Redis required on Vercel). */
export async function enqueueSeoJob(type, payload = null) {
  try {
    const pending = await db.seoJob.findFirst({
      where: { type, status: { in: ["PENDING", "RUNNING"] } },
    });
    if (pending) return { skipped: true, reason: "already_queued", jobId: pending.id };

    const job = await db.seoJob.create({
      data: { type, payload: payload || undefined },
    });
    return { ok: true, jobId: job.id };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function enqueueSeoMonitorBatch() {
  const results = [];
  for (const type of MONITOR_JOB_TYPES) {
    results.push({ type, ...(await enqueueSeoJob(type)) });
  }
  return results;
}

async function executeSeoJob(job) {
  switch (job.type) {
    case "CRAWL": {
      const result = await runCrawlMonitor({ source: "job" });
      await alertCrawlFailure(result);
      return result;
    }
    case "GSC_SYNC":
      return syncGscToDatabase();
    case "GSC_DAILY":
      return syncGscDailyMetrics();
    case "PAGESPEED":
      return runPageSpeedSuite();
    case "AUDIT": {
      const report = await runSeoAudit();
      let persistedId = null;
      try {
        const row = await db.seoAuditRun.create({
          data: {
            ok: report.ok,
            summary: report.summary,
            issues: report.issues || [],
          },
        });
        persistedId = row.id;
      } catch {
        /* table may not exist until migrate */
      }
      await alertAuditIssues(report);
      return { ok: report.ok, persistedId, summary: report.summary };
    }
    case "CONTENT_SYNC": {
      const pages = await syncComparisonPagesFromInventory({ maxPairs: 30 });
      return { ok: true, synced: pages.length };
    }
    default:
      return { ok: false, error: `unknown_job_type:${job.type}` };
  }
}

export async function processPendingSeoJobs({ limit = 8 } = {}) {
  const jobs = await db.seoJob.findMany({
    where: { status: "PENDING" },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  const outcomes = [];
  for (const job of jobs) {
    const updated = await db.seoJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
    });

    try {
      const result = await executeSeoJob(updated);
      const failed = result?.ok === false && !result?.skipped;
      await db.seoJob.update({
        where: { id: job.id },
        data: {
          status: failed ? "FAILED" : "DONE",
          result: result || {},
          error: failed ? result?.error || "job_failed" : null,
          finishedAt: new Date(),
        },
      });
      outcomes.push({ id: job.id, type: job.type, status: failed ? "FAILED" : "DONE", result });
    } catch (e) {
      const attempts = updated.attempts;
      const terminal = attempts >= updated.maxAttempts;
      await db.seoJob.update({
        where: { id: job.id },
        data: {
          status: terminal ? "FAILED" : "PENDING",
          error: e.message,
          finishedAt: terminal ? new Date() : null,
        },
      });
      outcomes.push({ id: job.id, type: job.type, status: terminal ? "FAILED" : "RETRY", error: e.message });
    }
  }

  return { processed: outcomes.length, outcomes };
}

export async function getRecentSeoJobs({ take = 12 } = {}) {
  try {
    return await db.seoJob.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });
  } catch {
    return [];
  }
}
