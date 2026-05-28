// Same-origin JPEG for dealer showroom clipboard / link previews.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site-url";
import {
  buildBrandFallbackOgJpeg,
  buildWhatsAppOgJpeg,
  fetchListingImageBytes,
  fetchRemoteImageBytes,
} from "@/lib/og-listing-image";

export const runtime = "nodejs";
export const maxDuration = 25;

const CACHE_HEADERS = {
  "Content-Type": "image/jpeg",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

function resolveAbsoluteAsset(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return absoluteUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
}

async function jpegResponse(buf) {
  return new Response(buf, { status: 200, headers: CACHE_HEADERS });
}

async function bytesForUrl(url) {
  const listing = await fetchListingImageBytes(url);
  if (listing) return listing;
  return fetchRemoteImageBytes(url);
}

export async function GET(_req, { params }) {
  const slug = (await params)?.slug;
  if (!slug) {
    return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  }

  const dealer = await db.dealer.findUnique({
    where: { slug },
    select: { bannerUrl: true, logoUrl: true },
  });

  const candidates = [dealer?.bannerUrl, dealer?.logoUrl]
    .map(resolveAbsoluteAsset)
    .filter(Boolean);

  for (const assetUrl of candidates) {
    const bytes = await bytesForUrl(assetUrl);
    if (!bytes) continue;
    try {
      const jpeg = await buildWhatsAppOgJpeg(bytes);
      return jpegResponse(jpeg);
    } catch {
      /* try next asset */
    }
  }

  try {
    const fallback = await buildBrandFallbackOgJpeg();
    return jpegResponse(fallback);
  } catch {
    return NextResponse.json({ error: "og_image_unavailable" }, { status: 503 });
  }
}
