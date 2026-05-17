import { absoluteUrl } from "@/lib/site-url";
import { getGoogleAuthClient, parseGoogleServiceAccount } from "@/lib/google-service-account";

const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";

function indexingEnabled() {
  return (
    process.env.GOOGLE_INDEXING_ENABLED === "1" ||
    process.env.GOOGLE_INDEXING_ENABLED === "true"
  );
}

/**
 * Request Google Indexing API URL_UPDATED for a canonical listing URL.
 * Requires Search Console property + service account with access.
 * @param {string} pathname e.g. /cars/2019-toyota-...
 */
export async function requestGoogleUrlIndexing(pathname) {
  if (!indexingEnabled()) return { skipped: true, reason: "disabled" };

  if (!parseGoogleServiceAccount()) return { skipped: true, reason: "no_credentials" };

  const url = absoluteUrl(pathname);
  if (!url.startsWith("https://")) {
    return { skipped: true, reason: "https_only" };
  }

  try {
    const client = await getGoogleAuthClient([INDEXING_SCOPE]);
    if (!client) return { skipped: true, reason: "no_credentials" };
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
