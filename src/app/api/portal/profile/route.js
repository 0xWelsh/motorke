// src/app/api/portal/profile/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone-verification";

function toNullableCoordinate(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function inValidRange(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function extractCoordsFromMapsUrl(url) {
  if (!url) return null;
  const normalized = decodeURIComponent(url);
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,            // .../@-1.2921,36.8219,...
    /[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // ...?q=-1.2921,36.8219
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,         // ...!3d-1.2921!4d36.8219
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (inValidRange(lat, lng)) return { lat, lng };
  }

  return null;
}

async function resolveMapsCoords(rawUrl) {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;

  // First pass directly from provided URL.
  const direct = extractCoordsFromMapsUrl(trimmed);
  if (direct) return direct;

  // Second pass for short links that redirect (e.g. maps.app.goo.gl).
  try {
    const response = await fetch(trimmed, { redirect: "follow" });
    const finalUrl = response?.url;
    if (!finalUrl) return null;
    return extractCoordsFromMapsUrl(finalUrl);
  } catch {
    return null;
  }
}

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "DEALER") {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (!session.user.dealerId) {
    return NextResponse.redirect(new URL("/portal/profile?error=missing_dealer", request.url), 303);
  }

  const formData = await request.formData();

  const name = formData.get("name")?.toString().trim();
  const location = formData.get("location")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const mapsUrl = formData.get("googleMapsUrl")?.toString().trim() || "";

  if (!name || !location || !phone) {
    return NextResponse.redirect(new URL("/portal/profile?error=required", request.url), 303);
  }

  const manualLat = toNullableCoordinate(formData.get("lat"));
  const manualLng = toNullableCoordinate(formData.get("lng"));
  const mapsCoords = await resolveMapsCoords(mapsUrl);

  let lat = null;
  let lng = null;

  if (mapsCoords) {
    lat = mapsCoords.lat;
    lng = mapsCoords.lng;
  } else if (inValidRange(manualLat, manualLng)) {
    lat = manualLat;
    lng = manualLng;
  }

  await db.dealer.update({
    where: { id: session.user.dealerId },
    data: {
      name,
      phone,
      whatsapp:    formData.get("whatsapp")?.toString().trim() || null,
      email:       formData.get("email")?.toString().trim() || null,
      location,
      county:      formData.get("county")?.toString().trim() || "Nairobi",
      address:     formData.get("address")?.toString().trim() || null,
      lat,
      lng,
      description: formData.get("description")?.toString().trim() || null,
      website:     formData.get("website")?.toString().trim() || null,
    },
  });

  const verifiedKey = `phone-verified:${session.user.id}`;
  const verified = await db.setting.findUnique({ where: { key: verifiedKey } });
  if (verified?.value) {
    let parsed = {};
    try {
      parsed = JSON.parse(verified.value);
    } catch {}
    const nextDealerPhone = normalizeKenyanPhone(phone);
    const verifiedPhone = normalizeKenyanPhone(parsed?.phone || "");
    if (verifiedPhone && verifiedPhone !== nextDealerPhone) {
      await db.setting.delete({ where: { key: verifiedKey } }).catch(() => {});
    }
  }

  return NextResponse.redirect(new URL("/portal/profile?saved=1", request.url), 303);
}
