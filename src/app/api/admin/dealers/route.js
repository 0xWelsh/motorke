// src/app/api/admin/dealers/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const name     = formData.get("name")?.toString().trim();

  if (!name) {
    return NextResponse.redirect(new URL("/admin/dealers/new?error=missing", request.url));
  }

  try {
    // Generate a unique slug
    let slug    = slugify(name);
    let attempt = 0;
    while (await db.dealer.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${slugify(name)}-${attempt}`;
    }

    await db.dealer.create({
      data: {
        name,
        slug,
        county:      formData.get("county")?.toString()   || "Nairobi",
        location:    formData.get("location")?.toString().trim() || "",
        address:     formData.get("address")?.toString().trim()  || null,
        lat:         formData.get("lat") ? parseFloat(formData.get("lat")) : null,
        lng:         formData.get("lng") ? parseFloat(formData.get("lng")) : null,
        phone:       formData.get("phone")?.toString().trim()    || "",
        whatsapp:    formData.get("whatsapp")?.toString().trim() || null,
        email:       formData.get("email")?.toString().trim()    || null,
        website:     formData.get("website")?.toString().trim()  || null,
        description: formData.get("description")?.toString().trim() || null,
        verified:    formData.get("verified") === "on",
        featured:    formData.get("featured") === "on",
      },
    });

    return NextResponse.redirect(new URL("/admin/dealers?created=1", request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/admin/dealers/new?error=unknown", request.url));
  }
}
