// src/lib/view-source.js
// Classify a raw HTTP Referer header (or document.referrer) into a small
// set of buckets we display to dealers and roll up for reports.
//
// Returned values stay stable so existing data keeps grouping correctly:
//   "direct"   – no referrer at all (typed in / bookmark / native app link)
//   "internal" – came from another page on bidgari.com itself
//   "facebook" | "instagram" | "whatsapp" | "tiktok" | "x" | "linkedin"
//   "google"   – any google search property
//   "bing" | "yahoo" | "ddg"
//   "external" – any other recognisable web origin
//
// We deliberately keep the bucket list short so the analytics UI stays
// readable. New sources just fall into "external" until we explicitly add
// them.

const SOCIAL = [
  { match: (h) => h === "fb.me" || h === "fb.com" || h.endsWith("facebook.com"), bucket: "facebook" },
  { match: (h) => h.endsWith("instagram.com"),                                    bucket: "instagram" },
  { match: (h) => h.endsWith("whatsapp.com") || h === "wa.me",                    bucket: "whatsapp" },
  { match: (h) => h.endsWith("tiktok.com"),                                       bucket: "tiktok" },
  { match: (h) => h === "t.co" || h.endsWith("twitter.com") || h.endsWith("x.com"), bucket: "x" },
  { match: (h) => h.endsWith("linkedin.com") || h === "lnkd.in",                  bucket: "linkedin" },
  { match: (h) => h.endsWith("reddit.com"),                                       bucket: "reddit" },
  { match: (h) => h.endsWith("youtube.com") || h === "youtu.be",                  bucket: "youtube" },
  { match: (h) => h.endsWith("telegram.org") || h === "t.me",                     bucket: "telegram" },
];

const SEARCH = [
  { match: (h) => h.includes("google."),     bucket: "google" },
  { match: (h) => h.endsWith("bing.com"),    bucket: "bing"   },
  { match: (h) => h.endsWith("yahoo.com"),   bucket: "yahoo"  },
  { match: (h) => h.endsWith("duckduckgo.com"), bucket: "ddg" },
];

/**
 * @param {string|null|undefined} referrer  – raw URL or empty
 * @param {string|null|undefined} ownOrigin – e.g. "https://bidgari.com"
 *                                            (origin of the request, used to
 *                                            tell "internal" hops apart from
 *                                            real external traffic)
 * @returns {string} one of the buckets documented above
 */
export function classifyViewSource(referrer, ownOrigin) {
  if (!referrer || typeof referrer !== "string") return "direct";

  let url;
  try {
    url = new URL(referrer);
  } catch {
    return "direct";
  }

  const host = url.hostname.toLowerCase();
  if (!host) return "direct";

  // Internal hops within our own domain (and www. variant) get their own
  // bucket so dealers can tell "someone landed from Facebook" apart from
  // "someone clicked around the site".
  if (ownOrigin) {
    try {
      const ownHost = new URL(ownOrigin).hostname.toLowerCase();
      const bareOwn  = ownHost.replace(/^www\./, "");
      const bareThis = host.replace(/^www\./, "");
      if (bareThis === bareOwn) return "internal";
    } catch {}
  }

  for (const { match, bucket } of SOCIAL) if (match(host)) return bucket;
  for (const { match, bucket } of SEARCH) if (match(host)) return bucket;

  return "external";
}

// Friendly label for the analytics UI.
export function viewSourceLabel(bucket) {
  switch (bucket) {
    case "facebook":  return "Facebook";
    case "instagram": return "Instagram";
    case "whatsapp":  return "WhatsApp";
    case "tiktok":    return "TikTok";
    case "x":         return "X / Twitter";
    case "linkedin":  return "LinkedIn";
    case "reddit":    return "Reddit";
    case "youtube":   return "YouTube";
    case "telegram":  return "Telegram";
    case "google":    return "Google";
    case "bing":      return "Bing";
    case "yahoo":     return "Yahoo";
    case "ddg":       return "DuckDuckGo";
    case "internal":  return "On-site";
    case "direct":    return "Direct";
    case "external":  return "Other site";
    default:          return bucket || "Direct";
  }
}
