// src/app/cars/[id]/opengraph-image.js
// Dynamic OG image for car detail pages. Renders a 1200x630 poster:
// the primary photo full-width with a brand gutter on top and a
// details gutter on the bottom (title, price, specs, dealer).
// Picked up automatically by Next.js for og:image and (via fallback)
// twitter:image, so every WhatsApp / Facebook / X / iMessage unfurl
// becomes a branded preview.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

export const runtime = "nodejs"; // Prisma + Node fs both need Node runtime.
// Long ISR window: once a car's poster is generated, serve it for a
// week at the edge before regenerating. Combined with the explicit
// Cache-Control headers below, this means scrapers (WhatsApp / Facebook
// / X) get an instant response on every share after the first.
export const revalidate = 604800;
export const alt = "Welsh Motorhub car listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0a0a";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";
const BRAND_EMERALD = "#22c55e";
const NEUTRAL_TILE = "#1a1a1a";

// Cache the font bytes for the lifetime of the lambda — readFile is
// fast but we still want to avoid re-reading on every request.
let cachedFont = null;
async function loadInterBold() {
  if (cachedFont) return cachedFont;
  const buf = await readFile(
    join(process.cwd(), "fonts/watermark/inter-latin-700-normal.woff")
  );
  cachedFont = buf;
  return cachedFont;
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
}

// Cache-Control applied to every generated response. We keep
// `s-maxage` long (Vercel/CDN holds the bytes for a week) and lean on
// `stale-while-revalidate` so a scraper never waits on a regen — if
// the cache is stale, the old bytes ship instantly while a refresh
// happens in the background. `max-age` for the actual scraper / user
// is shorter so price/title edits propagate within an hour.
const RESPONSE_HEADERS = {
  "cache-control":
    "public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000",
};

/**
 * Fetch the hero photo ourselves with a hard timeout, then hand
 * satori a `data:` URL. This is the key reliability move: scrapers
 * give us ~5 s to produce the OG image; if we let satori fetch the
 * photo and Supabase is having a slow night, we blow past that
 * budget and the scraper ships the link without a preview. By doing
 * the fetch with our own AbortController we guarantee we either
 * embed the photo (when it loads in time) or fall back to a branded
 * card (when it doesn't), but we always return a valid PNG fast.
 */
async function fetchHeroAsDataUrl(url, timeoutMs = 2500) {
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // Re-use any HTTP cache the platform has for this URL.
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!contentType.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Hard size cap — anything over 4 MB will take too long for
    // satori to encode anyway and won't materially improve the
    // 1200x470 render. Better to fall back to the branded card.
    if (buf.byteLength > 4 * 1024 * 1024) return null;
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function HeroPlaceholder() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 45%, #0d1f15 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: BRAND_EMERALD,
            borderRadius: 9,
            display: "flex",
          }}
        />
        <span
          style={{
            fontSize: 44,
            color: "white",
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          Welsh Motorhub
        </span>
      </div>
      <span
        style={{
          marginTop: 14,
          color: "rgba(255,255,255,0.55)",
          fontSize: 18,
          letterSpacing: 2,
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        Tap to open the listing
      </span>
    </div>
  );
}

function BrandFallback() {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 44,
            height: 44,
            background: BRAND_EMERALD,
            borderRadius: 10,
            display: "flex",
          }}
        />
        <span style={{ fontSize: 64, letterSpacing: "-0.02em" }}>
          Welsh Motorhub
        </span>
      </div>
      <span
        style={{
          fontSize: 22,
          color: "rgba(255,255,255,0.6)",
          marginTop: 16,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Verified cars across Kenya
      </span>
    </div>
  );
}

export default async function Image({ params }) {
  const { id } = await params;
  const fontData = await loadInterBold();
  const fonts = [
    { name: "Inter", data: fontData, weight: 700, style: "normal" },
  ];

  let car = null;
  try {
    car = await db.car.findFirst({
      where: {
        id,
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
      },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 },
        dealer: {
          select: { name: true, verified: true, location: true },
        },
      },
    });
  } catch {
    car = null;
  }

  if (!car) {
    return new ImageResponse(<BrandFallback />, {
      ...size,
      fonts,
      headers: RESPONSE_HEADERS,
    });
  }

  const heroUrl = car.images?.[0]?.url || null;
  const hero = await fetchHeroAsDataUrl(heroUrl, 2500);

  const titleRaw = `${car.year} ${car.make} ${car.model}${
    car.variant ? ` ${car.variant}` : ""
  }`;
  const title = truncate(titleRaw, 40);
  const price = formatCarPrice(car) || "Contact for price";
  const specs = [
    car.mileage ? formatMileage(car.mileage) : null,
    car.fuelType
      ? car.fuelType.charAt(0) + car.fuelType.slice(1).toLowerCase()
      : null,
    car.transmission
      ? car.transmission.charAt(0) + car.transmission.slice(1).toLowerCase()
      : null,
    car.location || car.dealer?.location || null,
  ].filter(Boolean);
  const specsLine = truncate(specs.join("  ·  "), 70);
  const dealerName = truncate(car.dealer?.name || "Welsh Motorhub", 28);
  const verified = Boolean(car.dealer?.verified);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: "white",
          fontFamily: "Inter",
        }}
      >
        {/* Top brand gutter */}
        <div
          style={{
            display: "flex",
            height: 60,
            padding: "0 32px",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${SURFACE_BORDER}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 30,
                height: 30,
                background: BRAND_EMERALD,
                borderRadius: 7,
                display: "flex",
              }}
            />
            <span
              style={{
                fontSize: 21,
                letterSpacing: 2.5,
              }}
            >
              WELSH MOTORHUB
            </span>
          </div>
          {verified ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(34,197,94,0.12)",
                color: BRAND_EMERALD,
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 13,
                letterSpacing: 1.5,
                border: `1px solid rgba(34,197,94,0.4)`,
              }}
            >
              ✓ VERIFIED DEALER
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                color: "rgba(255,255,255,0.55)",
                fontSize: 13,
                letterSpacing: 1.5,
              }}
            >
              FOR SALE IN KENYA
            </div>
          )}
        </div>

        {/* Hero photo — full width. When the fetch with timeout
            couldn't pull the photo we render a branded card in its
            place so the share preview still ships in time. */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
            background: NEUTRAL_TILE,
            position: "relative",
          }}
        >
          {hero ? (
            <img
              src={hero}
              width={1200}
              height={470}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <HeroPlaceholder />
          )}
          {/* Soft vignette so the bottom gutter reads even when the hero is bright */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
              display: "flex",
            }}
          />
        </div>

        {/* Bottom info gutter */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "18px 32px 20px",
            height: 100,
            borderTop: `1px solid ${SURFACE_BORDER}`,
            background: "linear-gradient(to top, #050505, #0a0a0a)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              width: "100%",
            }}
          >
            <span
              style={{
                fontSize: 30,
                letterSpacing: "-0.01em",
                maxWidth: 800,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                display: "flex",
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: 30,
                color: BRAND_EMERALD,
                letterSpacing: "-0.01em",
                display: "flex",
              }}
            >
              {price}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              color: "rgba(255,255,255,0.65)",
              marginTop: 10,
              gap: 12,
              alignItems: "center",
            }}
          >
            <span style={{ display: "flex" }}>{specsLine}</span>
            {dealerName ? (
              <>
                <span style={{ color: "rgba(255,255,255,0.3)", display: "flex" }}>
                  ·
                </span>
                <span style={{ display: "flex", color: BRAND_EMERALD }}>
                  {dealerName}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts, headers: RESPONSE_HEADERS }
  );
}
