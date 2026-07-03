// src/app/api/admin/dealers/route.js
export const dynamic = "force-dynamic";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { resolveDealerCoordinates } from "@/lib/geocode";

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

    const coords = await resolveDealerCoordinates({
      lat: formData.get("lat"),
      lng: formData.get("lng"),
      address,
      location,
      county,
    });
    const phone = formData.get("phone")?.toString().trim() || "";
    const whatsapp = formData.get("whatsapp")?.toString().trim() || null;
    const email = formData.get("email")?.toString().trim() || null;
    const website = formData.get("website")?.toString().trim() || null;
    const instagramUrl = formData.get("instagramUrl")?.toString().trim() || null;
    const facebookUrl = formData.get("facebookUrl")?.toString().trim() || null;
    const tiktokUrl = formData.get("tiktokUrl")?.toString().trim() || null;
    const description = formData.get("description")?.toString().trim() || null;
    const responseTime = formData.get("responseTime")?.toString().trim() || null;
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
            lat: coords.lat,
            lng: coords.lng,
            phone,
            whatsapp,
            email,
            website,
            instagramUrl,
            facebookUrl,
            tiktokUrl,
            description,
            responseTime,
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

    // CREATE USER IF EMAIL IS PROVIDED
    if (email) {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (!existingUser) {
        const { hash } = require("bcryptjs");
        const tempPassword = crypto.randomBytes(16).toString("hex");
        const passwordHash = await hash(tempPassword, 10);
        const user = await db.user.create({
          data: {
            email,
            passwordHash,
            name: name,
            role: "DEALER",
            dealerId: created.id,
            active: true
          }
        });
        console.log(`[AUDIT] Admin ${session.user.email} created dealer user ${email} — temporary password set`);
      } else if (!existingUser.dealerId) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { dealerId: created.id, role: "DEALER" }
        });
      }
    }


    return NextResponse.redirect(new URL("/admin/dealers?created=1", request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/admin/dealers/new?error=unknown", request.url));
  }
}
