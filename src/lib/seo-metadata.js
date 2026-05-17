import { absoluteUrl } from "@/lib/site-url";
import { BRAND_OG_IMAGE } from "@/lib/site-url";

/**
 * Shared metadata builders for programmatic SEO pages.
 */

export function buildPageTitle(primary, { template = true } = {}) {
  const t = String(primary || "").trim();
  if (!t) return "Welsh Motorhub";
  if (!template) return t;
  return t.includes("Welsh Motorhub") ? t : `${t} | Welsh Motorhub`;
}

export function buildCanonicalMetadata(pathname) {
  const path = pathname?.startsWith("/") ? pathname : `/${pathname || ""}`;
  return { alternates: { canonical: path } };
}

export function buildOpenGraph({
  title,
  description,
  pathname = "/",
  images = [BRAND_OG_IMAGE],
  type = "website",
}) {
  return {
    title,
    description,
    type,
    url: absoluteUrl(pathname),
    images: images.map((url) =>
      typeof url === "string"
        ? { url, width: 1200, height: 630, alt: title }
        : url,
    ),
  };
}

export function buildListingMetadata({
  title,
  description,
  pathname,
  images = [],
  noindex = false,
}) {
  const ogImages = images.length ? images : [BRAND_OG_IMAGE];
  return {
    title: buildPageTitle(title, { template: false }),
    description,
    ...buildCanonicalMetadata(pathname),
    openGraph: buildOpenGraph({ title, description, pathname, images: ogImages, type: "website" }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((u) => (typeof u === "string" ? u : u.url)),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function buildHubMetadata({ title, description, pathname }) {
  return {
    title: buildPageTitle(title),
    description,
    ...buildCanonicalMetadata(pathname),
    openGraph: buildOpenGraph({ title, description, pathname }),
  };
}
