import { GoogleAuth } from "google-auth-library";
import { absoluteUrl } from "@/lib/site-url";

const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";

function indexingEnabled() {
  return (
    process.env.GOOGLE_INDEXING_ENABLED === "1" ||
    process.env.GOOGLE_INDEXING_ENABLED === "true"
  );
}

function parseServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn("[seo] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }
}

/**
 * Request Google Indexing API URL_UPDATED for a canonical listing URL.
 * Requires Search Console property + service account with access.
 * @param {string} pathname e.g. /cars/2019-toyota-...
 */
export async function requestGoogleUrlIndexing(pathname) {
  if (!indexingEnabled()) return { skipped: true, reason: "disabled" };

  const credentials = parseServiceAccount();
  if (!credentials) return { skipped: true, reason: "no_credentials" };

  const url = absoluteUrl(pathname);
  if (!url.startsWith("https://")) {
    return { skipped: true, reason: "https_only" };
  }

  try {
    const auth = new GoogleAuth({
      credentials,
      scopes: [INDEXING_SCOPE],
    });
    const client = await auth.getClient();
    const res = await client.request({
      url: INDEXING_ENDPOINT,
      method: "POST",
      data: {
        url,
        type: "URL_UPDATED",
      },
    });
    return { ok: true, status: res.status, url };
  } catch (err) {
    console.warn("[seo] Google Indexing API:", err?.message || err);
    return { ok: false, error: err?.message || String(err), url };
  }
}
