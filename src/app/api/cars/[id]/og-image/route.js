// Proxies listing photos as same-origin 1200×630 JPEG for WhatsApp / Facebook crawlers.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";
import {
  buildBrandFallbackOgJpeg,
  buildPlainOgJpeg,
  fetchListingImageBytes,
} from "@/lib/og-listing-image";

export const runtime = "nodejs";
export const maxDuration = 25;

const CACHE_HEADERS = {
  "Content-Type": "image/jpeg",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

async function jpegResponse(buf) {
  return new Response(buf, { status: 200, headers: CACHE_HEADERS });
}

function orderedImageUrls(car) {
  const rows = Array.isArray(car?.images) ? car.images : [];
  const sorted = [...rows].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const seen = new Set();
  const urls = [];
  for (const row of sorted) {
    const u = row?.url?.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    urls.push(u);
  }
  return urls;
}

export async function GET(_req, { params }) {
  const ref = (await params)?.id;

  const car = ref
    ? await db.car.findFirst({
        where: {
          AND: [
            publicDetailVisibilityClause(),
            { OR: [{ id: ref }, { publicSlug: ref }] },
            ...(PUBLIC_ONLY_VERIFIED_DEALERS ? [{ dealer: { verified: true } }] : []),
          ],
        },
        select: {
          id: true,
          make: true,
          model: true,
          variant: true,
          year: true,
          price: true,
          mileage: true,
          dealer: { select: { name: true, location: true } },
          images: {
            orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
            select: { url: true, isPrimary: true, order: true },
          },
        },
      })
    : null;

  const candidates = orderedImageUrls(car);

  for (const rawUrl of candidates) {
    const bytes = await fetchListingImageBytes(rawUrl);
    if (!bytes) continue;
    try {
      const jpeg = await buildPlainOgJpeg(bytes);
      return jpegResponse(jpeg);
    } catch {
      // corrupt / unsupported — try next image
    }
  }

  try {
    const fallback = await buildBrandFallbackOgJpeg();
    return jpegResponse(fallback);
  } catch {
    return NextResponse.json({ error: "og_image_unavailable" }, { status: 503 });
  }
}
