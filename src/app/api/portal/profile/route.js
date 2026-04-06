// src/app/api/portal/profile/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

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

  if (!name || !location || !phone) {
    return NextResponse.redirect(new URL("/portal/profile?error=required", request.url), 303);
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
      description: formData.get("description")?.toString().trim() || null,
      website:     formData.get("website")?.toString().trim() || null,
    },
  });

  return NextResponse.redirect(new URL("/portal/profile?saved=1", request.url), 303);
}
