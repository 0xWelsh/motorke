/**
 * Client for the Go SEO worker (services/seo-worker).
 */

function workerConfig() {
  const base = (process.env.SEO_WORKER_URL || "").replace(/\/$/, "");
  const secret = process.env.SEO_WORKER_SECRET;
  const headers = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return { base, headers };
}

async function postJson(path, body, timeoutMs = 60_000) {
  const { base, headers } = workerConfig();
  if (!base) return { skipped: true, reason: "SEO_WORKER_URL not set" };

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, error: await res.text() };
  }
  return res.json();
}

export async function crawlSiteSmoke(paths = []) {
  return postJson("/crawl/site", { paths });
}

export async function crawlUrls(urls = []) {
  if (!urls.length) return { ok: true, results: [] };
  return postJson("/crawl", { urls: urls.slice(0, 50) });
}
