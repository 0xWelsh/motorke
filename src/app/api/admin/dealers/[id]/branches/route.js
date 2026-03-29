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
  const name     = formData.get("name")?.toString().trim();
  const location = formData.get("location")?.toString().trim() || "";
  
  if (!name) {
    return NextResponse.redirect(new URL(`/admin/dealers/${id}/branches/new?error=missing`, request.url));
  }

  try {
    await db.dealerBranch.create({
      data: {
        dealerId: id,
        name,
        location,
        county:   formData.get("county")?.toString() || "Nairobi",
        address:  formData.get("address")?.toString().trim() || null,
        phone:    formData.get("phone")?.toString().trim() || null,
        whatsapp: formData.get("whatsapp")?.toString().trim() || null,
        lat:      formData.get("lat") ? parseFloat(formData.get("lat")) : null,
        lng:      formData.get("lng") ? parseFloat(formData.get("lng")) : null,
      }
    });

    return NextResponse.redirect(new URL(`/admin/dealers/${id}/edit?saved=1`, request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL(`/admin/dealers/${id}/branches/new?error=unknown`, request.url));
  }
}
