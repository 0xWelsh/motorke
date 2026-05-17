import { getGoogleAuthClient, parseGoogleServiceAccount } from "@/lib/google-service-account";
import { getSiteOrigin } from "@/lib/site-url";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const GSC_API = "https://www.googleapis.com/webmasters/v3/sites";

function gscEnabled() {
  return process.env.GSC_SYNC_ENABLED === "1" || process.env.GSC_SYNC_ENABLED === "true";
}

export function getGscSiteUrl() {
  const fromEnv = process.env.GSC_SITE_URL?.trim();
  if (fromEnv) return fromEnv;
  const origin = getSiteOrigin();
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return null;
  }
  return origin;
}

function formatGscDate(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/**
 * @param {{ startDate: Date; endDate: Date; dimensions: string[]; rowLimit?: number }} opts
 */
async function querySearchAnalytics(siteUrl, opts) {
  const credentials =
    parseGoogleServiceAccount("GSC_SERVICE_ACCOUNT_JSON") ||
    parseGoogleServiceAccount("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!credentials) return { skipped: true, reason: "no_credentials" };

  const client = await getGoogleAuthClient([GSC_SCOPE], "GSC_SERVICE_ACCOUNT_JSON");
  if (!client) return { skipped: true, reason: "auth_failed" };

  const encodedSite = encodeURIComponent(siteUrl);
  const url = `${GSC_API}/${encodedSite}/searchAnalytics/query`;

  const res = await client.request({
    url,
    method: "POST",
    data: {
      startDate: formatGscDate(opts.startDate),
      endDate: formatGscDate(opts.endDate),
      dimensions: opts.dimensions,
      rowLimit: opts.rowLimit ?? 100,
    },
  });

  return { ok: true, rows: res.data?.rows || [] };
}

/**
 * Sync top queries and pages for the last N days into Postgres (via caller).
 */
export async function fetchGscPerformance({ days = 28 } = {}) {
  if (!gscEnabled()) return { skipped: true, reason: "disabled" };

  const siteUrl = getGscSiteUrl();
  if (!siteUrl) return { skipped: true, reason: "no_site_url" };

  const endDate = daysAgo(2);
  const startDate = daysAgo(days + 2);

  const [queries, pages] = await Promise.all([
    querySearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 100,
    }),
    querySearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 50,
    }),
  ]);

  if (queries.skipped) return queries;
  if (pages.skipped) return pages;
  if (!queries.ok || !pages.ok) {
    return { ok: false, error: "gsc_query_failed" };
  }

  const mapRows = (rows, dimension) =>
    (rows || []).map((row) => ({
      dimension,
      key: row.keys?.[0] || "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }));

  return {
    ok: true,
    siteUrl,
    startDate,
    endDate,
    rows: [
      ...mapRows(queries.rows, "query"),
      ...mapRows(pages.rows, "page"),
    ].filter((r) => r.key),
  };
}
