// src/app/api/admin/dealers/[id]/route.js  — POST update
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

  try {
    
    const email = formData.get("email")?.toString().trim() || null;
    const name = formData.get("name")?.toString().trim();
    const county = formData.get("county")?.toString() || "Nairobi";
    const location = formData.get("location")?.toString().trim();
    const address = formData.get("address")?.toString().trim() || null;

    const coords = await resolveDealerCoordinates({
      lat: formData.get("lat"),
      lng: formData.get("lng"),
      address,
      location,
      county,
    });

    await db.dealer.update({
      where: { id: id },
      data: {
        name,
        county,
        location,
        address,
        lat: coords.lat,
        lng: coords.lng,
        phone:       formData.get("phone")?.toString().trim(),
        whatsapp:    formData.get("whatsapp")?.toString().trim() || null,
        email,
        website:     formData.get("website")?.toString().trim()  || null,
        instagramUrl: formData.get("instagramUrl")?.toString().trim() || null,
        facebookUrl:  formData.get("facebookUrl")?.toString().trim() || null,
        tiktokUrl:    formData.get("tiktokUrl")?.toString().trim() || null,
        description: formData.get("description")?.toString().trim() || null,
        verified:    formData.get("verified") === "on",
        featured:    formData.get("featured") === "on",
      },
    });

    if (email) {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (!existingUser) {
        const { hash } = require("bcryptjs");
        const defaultPasswordHash = await hash("Welsh Motorhub123!", 10);
        await db.user.create({
          data: {
            email,
            passwordHash: defaultPasswordHash,
            name: name,
            role: "DEALER",
            dealerId: id,
            active: true
          }
        });
      } else if (!existingUser.dealerId) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { dealerId: id, role: "DEALER" }
        });
      }
    }


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
