/**
 * Optional client for the Go SEO worker (services/seo-worker).
 */

export async function crawlSiteSmoke(paths = []) {
  const base = (process.env.SEO_WORKER_URL || "").replace(/\/$/, "");
  if (!base) return { skipped: true, reason: "SEO_WORKER_URL not set" };

  const headers = { "Content-Type": "application/json" };
  const secret = process.env.SEO_WORKER_SECRET;
  if (secret) headers.Authorization = `Bearer ${secret}`;

  const res = await fetch(`${base}/crawl/site`, {
    method: "POST",
    headers,
    body: JSON.stringify({ paths }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, error: await res.text() };
  }
  return res.json();
}
