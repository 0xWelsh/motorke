// src/app/api/admin/cars/[id]/delete/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { deleteImage } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const car = await db.car.findUnique({
    where:   { id: id },
    include: { images: true },
  });

  if (!car) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Dealers can only delete their own cars
  if (session.user.role === "DEALER" && car.dealerId !== session.user.dealerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete images from Supabase Storage
  for (const img of car.images) {
    await deleteImage(img.url).catch((error) => {
      console.error("Failed to delete car image during car deletion:", {
        carId: id,
        imageUrl: img.url,
        error,
      });
    });
  }

  // Delete from DB (cascade removes images + leads)
  await db.lead.deleteMany({ where: { carId: id } });
  await db.carImage.deleteMany({ where: { carId: id } });
  await db.car.delete({ where: { id: id } });

  // Redirect back to the right list
  const dest = session.user.role === "ADMIN" ? "/admin/cars" : "/portal";
  return NextResponse.redirect(new URL(dest, request.url));
}
