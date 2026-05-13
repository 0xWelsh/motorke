// Proxies the listing hero image through our own domain so WhatsApp /
// Facebook crawlers (which can be picky about third-party hosts, TLS,
// or stale signed URLs) fetch from welshmotorhub.co.ke first. Falls back
// to the static brand OG image on any error.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BRAND_OG_IMAGE, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { isCarImageStorageUrl, normalizeListingHeroImageUrl } from "@/lib/listing-image-url";

export const runtime = "nodejs";
export const maxDuration = 15;

const MAX_BYTES = 6 * 1024 * 1024;
const TIMEOUT_MS = 9000;

function supabaseOriginOnly() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    return null;
  }
}

function redirectToBrand() {
  const target = new URL(BRAND_OG_IMAGE, getSiteOrigin());
  return NextResponse.redirect(target, 307);
}

export async function GET(_req, { params }) {
  const { id } = await params;
  const origin = supabaseOriginOnly();

  const car = await db.car.findFirst({
    where: {
      id,
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    },
    select: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 },
    },
  });

  const raw = car?.images?.[0]?.url;
  const imageUrl = normalizeListingHeroImageUrl(raw);
  if (!imageUrl || !isCarImageStorageUrl(imageUrl, origin)) {
    return redirectToBrand();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
      redirect: "follow",
      cache: "no-store",
    });
    if (!upstream.ok) {
      return redirectToBrand();
    }
    const ct = (upstream.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!ct.startsWith("image/")) {
      return redirectToBrand();
    }
    const len = upstream.headers.get("content-length");
    if (len && Number(len) > MAX_BYTES) {
      return redirectToBrand();
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return redirectToBrand();
    }
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return redirectToBrand();
  } finally {
    clearTimeout(timer);
  }
}
