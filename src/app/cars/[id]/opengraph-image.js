// src/app/cars/[id]/opengraph-image.js
// Dynamic OG image for car detail pages. Renders a 1200x630 collage:
// hero shot on the left, 4 thumbnails in a 2x2 grid on the right, and
// two gutter bands carrying the brand on top + title/price/specs on
// the bottom. Picked up automatically by Next.js for og:image and
// (via fallback) twitter:image, so every WhatsApp / Facebook / X /
// iMessage unfurl becomes a branded poster.

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

export const runtime = "nodejs"; // Prisma + Node fs both need Node runtime.
export const revalidate = 3600;
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

function ThumbCell({ src, gutterLeft = 0, gutterTop = 0 }) {
  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        overflow: "hidden",
        background: NEUTRAL_TILE,
        borderLeft: `${gutterLeft}px solid ${BG}`,
        borderTop: `${gutterTop}px solid ${BG}`,
      }}
    >
      {src ? (
        <img
          src={src}
          width={240}
          height={235}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
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
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 5 },
        dealer: {
          select: { name: true, verified: true, location: true },
        },
      },
    });
  } catch {
    car = null;
  }

  if (!car) {
    return new ImageResponse(<BrandFallback />, { ...size, fonts });
  }

  const allUrls = (car.images || [])
    .map((img) => img?.url)
    .filter((url) => typeof url === "string" && url.length > 0);
  const hero = allUrls[0] || null;
  const thumbs = allUrls.slice(1, 5);
  // If we don't have 4 distinct thumbnails, pad with the hero so the
  // collage stays full instead of showing empty grey tiles.
  while (thumbs.length < 4 && hero) thumbs.push(hero);

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

        {/* Collage row: hero left, 2x2 thumbnails right */}
        <div style={{ display: "flex", flex: 1 }}>
          <div
            style={{
              width: 720,
              display: "flex",
              overflow: "hidden",
              background: NEUTRAL_TILE,
              position: "relative",
            }}
          >
            {hero ? (
              <img
                src={hero}
                width={720}
                height={470}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : null}
            {/* Soft vignette so the title band reads even if the hero is bright */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{
              width: 480,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", flex: 1 }}>
              <ThumbCell src={thumbs[0]} gutterLeft={2} />
              <ThumbCell src={thumbs[1]} gutterLeft={2} />
            </div>
            <div style={{ display: "flex", flex: 1 }}>
              <ThumbCell src={thumbs[2]} gutterLeft={2} gutterTop={2} />
              <ThumbCell src={thumbs[3]} gutterLeft={2} gutterTop={2} />
            </div>
          </div>
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
    { ...size, fonts }
  );
}
