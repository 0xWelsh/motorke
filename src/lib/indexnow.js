// src/lib/indexnow.js
// IndexNow: instant recrawl notices to Bing / Yandex / Seznam whenever listing
// content changes. The same key lives in three places — this constant, an
// env override (INDEXNOW_KEY), and the public files /{key}.txt + /indexnow.txt.
import { getSiteOrigin } from "@/lib/site-url";

const KEY = process.env.INDEXNOW_KEY || "829ccfab1b48026d43ab16e5fd214cc2";

export function indexnowKeyLocation() {
  const host = new URL(getSiteOrigin()).host;
  return `https://${host}/${KEY}.txt`;
}

/**
 * Fire-and-forget ping for a changed/added URL. Returns nothing; never throws.
 */
export async function submitUrlToIndexNow(url) {
  if (!url || !url.startsWith("http")) return false;
  try {
    const target =
      `https://api.indexnow.org/indexnow?url=${encodeURIComponent(url)}` +
      `&key=${KEY}&keyLocation=${encodeURIComponent(indexnowKeyLocation())}`;
    const res = await fetch(target, { method: "GET" });
    return res.status === 200 || res.status === 202 || res.status === 204;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[indexnow] submit failed:", err?.message || err);
    }
    return false;
  }
}