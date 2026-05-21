// src/app/api/portal/profile/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone-verification";
import { resolveDealerCoordinates } from "@/lib/geocode";

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
  const address = formData.get("address")?.toString().trim() || null;
  const county = formData.get("county")?.toString().trim() || "Nairobi";

  if (!name || !location || !phone) {
    return NextResponse.redirect(new URL("/portal/profile?error=required", request.url), 303);
  }

  const coords = await resolveDealerCoordinates({
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    address,
    location,
    county,
    mapsUrl,
  });

  await db.dealer.update({
    where: { id: session.user.dealerId },
    data: {
      name,
      phone,
      whatsapp: formData.get("whatsapp")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      location,
      county,
      address,
      lat: coords.lat,
      lng: coords.lng,
      description: formData.get("description")?.toString().trim() || null,
      website: formData.get("website")?.toString().trim() || null,
      instagramUrl: formData.get("instagramUrl")?.toString().trim() || null,
      facebookUrl: formData.get("facebookUrl")?.toString().trim() || null,
      tiktokUrl: formData.get("tiktokUrl")?.toString().trim() || null,
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

  const saved = coords.source === "geocode" ? "geocoded" : "1";
  return NextResponse.redirect(new URL(`/portal/profile?saved=${saved}`, request.url), 303);
}
