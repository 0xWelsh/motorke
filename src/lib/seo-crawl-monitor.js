import { db } from "@/lib/db";
import { crawlSiteSmoke, crawlUrls } from "@/lib/seo-worker-client";

const DEFAULT_PATHS = [
  "/",
  "/cars",
  "/duty",
  "/guides",
  "/blog",
  "/compare",
  "/sitemap.xml",
  "/robots.txt",
];

/** Run Go worker smoke crawl (or local fallback) and persist results. */
export async function runCrawlMonitor({ paths = DEFAULT_PATHS, source = "cron" } = {}) {
  let payload = await crawlSiteSmoke(paths);

  if (payload.skipped) {
    payload = await crawlUrlsLocal(paths);
  }

  const results = payload.results || [];
  const ok = payload.ok !== false && results.every((r) => r.status > 0 && r.status < 400 && !r.error);

  try {
    const run = await db.seoCrawlRun.create({
      data: {
        ok,
        source,
        meta: {
          paths,
          workerSkipped: Boolean(payload.skipped),
          workerReason: payload.reason || null,
        },
        entries: {
          create: results.map((r) => ({
            url: r.url,
            status: r.status || 0,
            title: r.title || null,
            error: r.error || null,
            durationMs: r.durationMs || 0,
          })),
        },
      },
      include: { entries: true },
    });

    const stale = await db.seoCrawlRun.findMany({
      orderBy: { createdAt: "desc" },
      skip: 20,
      select: { id: true },
    });
    if (stale.length) {
      await db.seoCrawlRun.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    }

    return { ok, runId: run.id, entryCount: run.entries.length, results };
  } catch (e) {
    return { ok: false, error: e.message, results };
  }
}

/** HEAD-check paths when SEO_WORKER_URL is not deployed. */
async function crawlUrlsLocal(paths) {
  const { getSiteOrigin } = await import("@/lib/site-url");
  const base = getSiteOrigin();
  const results = await Promise.all(
    paths.map(async (path) => {
      const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
      const start = Date.now();
      try {
        const res = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(20_000),
        });
        return {
          url,
          status: res.status,
          durationMs: Date.now() - start,
        };
      } catch (err) {
        return {
          url,
          status: 0,
          error: err.message,
          durationMs: Date.now() - start,
        };
      }
    }),
  );
  const ok = results.every((r) => r.status >= 200 && r.status < 400);
  return { ok, results, skipped: true, reason: "local_fallback" };
}

export async function getLatestCrawlRun() {
  try {
    return await db.seoCrawlRun.findFirst({
      orderBy: { createdAt: "desc" },
      include: { entries: { orderBy: { status: "desc" } } },
    });
  } catch {
    return null;
  }
}
