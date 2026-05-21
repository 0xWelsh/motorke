export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { resolveDealerCoordinates } from "@/lib/geocode";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const name     = formData.get("name")?.toString().trim();
  const location = formData.get("location")?.toString().trim() || "";
  
  if (!name) {
    return NextResponse.redirect(new URL(`/admin/dealers/${id}/branches/new?error=missing`, request.url));
  }

  try {
    const county = formData.get("county")?.toString() || "Nairobi";
    const address = formData.get("address")?.toString().trim() || null;
    const coords = await resolveDealerCoordinates({
      lat: formData.get("lat"),
      lng: formData.get("lng"),
      address,
      location,
      county,
    });

    await db.dealerBranch.create({
      data: {
        dealerId: id,
        name,
        location,
        county,
        address,
        phone:    formData.get("phone")?.toString().trim() || null,
        whatsapp: formData.get("whatsapp")?.toString().trim() || null,
        lat: coords.lat,
        lng: coords.lng,
      }
    });

    return NextResponse.redirect(new URL(`/admin/dealers/${id}/edit?saved=1`, request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL(`/admin/dealers/${id}/branches/new?error=unknown`, request.url));
  }
}
