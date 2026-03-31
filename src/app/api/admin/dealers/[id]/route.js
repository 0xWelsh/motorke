// src/app/api/admin/dealers/[id]/route.js  — POST update
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  try {
    await db.dealer.update({
      where: { id: id },
      data: {
        name:        formData.get("name")?.toString().trim(),
        county:      formData.get("county")?.toString()         || "Nairobi",
        location:    formData.get("location")?.toString().trim(),
        address:     formData.get("address")?.toString().trim() || null,
        lat:         formData.get("lat") ? parseFloat(formData.get("lat")) : null,
        lng:         formData.get("lng") ? parseFloat(formData.get("lng")) : null,
        phone:       formData.get("phone")?.toString().trim(),
        whatsapp:    formData.get("whatsapp")?.toString().trim() || null,
        email:       formData.get("email")?.toString().trim()    || null,
        website:     formData.get("website")?.toString().trim()  || null,
        description: formData.get("description")?.toString().trim() || null,
        verified:    formData.get("verified") === "on",
        featured:    formData.get("featured") === "on",
      },
    });

    return NextResponse.redirect(
      new URL(`/admin/dealers/${id}/edit?saved=1`, request.url)
    );
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(
      new URL(`/admin/dealers/${id}/edit?error=1`, request.url)
    );
  }
}
