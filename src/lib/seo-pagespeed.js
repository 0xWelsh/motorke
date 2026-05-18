import { db } from "@/lib/db";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";
import { alertPageSpeedRegression } from "@/lib/seo-alerts";

function psiEnabled() {
  return Boolean(process.env.GOOGLE_PAGESPEED_API_KEY?.trim());
}

function scoreFromCategory(categories, name) {
  const s = categories?.[name]?.score;
  if (s == null || Number.isNaN(Number(s))) return null;
  return Math.round(Number(s) * 100);
}

function auditMs(audits, id) {
  const v = audits?.[id]?.numericValue;
  return v != null && Number.isFinite(Number(v)) ? Number(v) : null;
}

/**
 * @param {{ url: string; strategy?: 'mobile' | 'desktop' }} opts
 */
export async function runPageSpeedCheck({ url, strategy = "mobile" }) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();
  if (!apiKey) return { skipped: true, reason: "no_api_key" };

  const target = url.startsWith("http") ? url : absoluteUrl(url);
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", target);
  api.searchParams.set("strategy", strategy);
  api.searchParams.set("category", "performance");
  api.searchParams.set("category", "accessibility");
  api.searchParams.set("category", "best-practices");
  api.searchParams.set("category", "seo");
  api.searchParams.set("key", apiKey);

  const res = await fetch(api.toString(), { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: text.slice(0, 300) || `PSI ${res.status}` };
  }

  const data = await res.json();
  const lh = data?.lighthouseResult;
  const categories = lh?.categories || {};
  const audits = lh?.audits || {};

  const performance = scoreFromCategory(categories, "performance");
  const row = {
    url: target,
    strategy,
    performance,
    accessibility: scoreFromCategory(categories, "accessibility"),
    bestPractices: scoreFromCategory(categories, "best-practices"),
    seoScore: scoreFromCategory(categories, "seo"),
    lcpMs: auditMs(audits, "largest-contentful-paint"),
    fcpMs: auditMs(audits, "first-contentful-paint"),
    cls: auditMs(audits, "cumulative-layout-shift"),
  };

  try {
    const saved = await db.seoPageSpeedRun.create({ data: row });
    const threshold = Number(process.env.SEO_PAGESPEED_ALERT_THRESHOLD || 50);
    await alertPageSpeedRegression({ url: target, strategy, performance, threshold });

    const stale = await db.seoPageSpeedRun.findMany({
      where: { url: target, strategy },
      orderBy: { createdAt: "desc" },
      skip: 30,
      select: { id: true },
    });
    if (stale.length) {
      await db.seoPageSpeedRun.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    }

    return { ok: true, id: saved.id, ...row };
  } catch (e) {
    return { ok: false, error: e.message, ...row };
  }
}

export async function runPageSpeedSuite() {
  if (!psiEnabled()) return { skipped: true, reason: "no_api_key" };

  const paths = ["/", "/cars"];
  const results = [];
  for (const path of paths) {
    for (const strategy of ["mobile", "desktop"]) {
      results.push(await runPageSpeedCheck({ url: path, strategy }));
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return { ok: true, results };
}

export async function getLatestPageSpeedRuns({ take = 8 } = {}) {
  try {
    return await db.seoPageSpeedRun.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });
  } catch {
    return [];
  }
}

export function defaultPageSpeedUrls() {
  return [getSiteOrigin(), absoluteUrl("/cars")];
}
