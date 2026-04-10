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
    const baseSlug = slugify(name) || `dealer-${Date.now()}`;
    const county = formData.get("county")?.toString() || "Nairobi";
    const location = formData.get("location")?.toString().trim() || "";
    const address = formData.get("address")?.toString().trim() || null;
    const latRaw = formData.get("lat")?.toString();
    const lngRaw = formData.get("lng")?.toString();
    const phone = formData.get("phone")?.toString().trim() || "";
    const whatsapp = formData.get("whatsapp")?.toString().trim() || null;
    const email = formData.get("email")?.toString().trim() || null;
    const website = formData.get("website")?.toString().trim() || null;
    const description = formData.get("description")?.toString().trim() || null;
    const verified = formData.get("verified") === "on";
    const featured = formData.get("featured") === "on";

    let created = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Date.now()}-${attempt}`;
      try {
        created = await db.dealer.create({
          data: {
            name,
            slug,
            county,
            location,
            address,
            lat: latRaw ? parseFloat(latRaw) : null,
            lng: lngRaw ? parseFloat(lngRaw) : null,
            phone,
            whatsapp,
            email,
            website,
            description,
            verified,
            featured,
          },
        });
        break;
      } catch (err) {
        const isSlugConflict =
          err?.code === "P2002" &&
          Array.isArray(err?.meta?.target) &&
          err.meta.target.includes("slug");
        if (!isSlugConflict || attempt === 5) throw err;
      }
    }

    if (!created) {
      throw new Error("Unable to create dealer. Please try again.");
    }

    return NextResponse.redirect(new URL("/admin/dealers?created=1", request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/admin/dealers/new?error=unknown", request.url));
  }
}
