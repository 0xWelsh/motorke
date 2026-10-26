// src/app/api/cars/[id]/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

export async function GET(request, { params }) {
  const { id } = await params;
  const car = await db.car.findFirst({
    where: {
      id,
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    },
    include: {
      images: { orderBy: { order: "asc" } },
      dealer: {
        select: {
          id: true, name: true, slug: true, description: true, logoUrl: true,
          bannerUrl: true, location: true, county: true, lat: true, lng: true,
          type: true, verified: true, featured: true, responseTime: true,
          branches: true, gallery: true,
        },
      },
    },
  });

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  // NOTE: We used to bump `car.views` here, but the public car page
  // never calls this endpoint – it reads Prisma directly. The single
  // source of truth for view tracking is now `POST /api/cars/views`,
  // fired from <TrackRecentView> on the client. Incrementing here as
  // well caused double counts whenever the compare drawer or the
  // dealer portal touched a car (and zero counts everywhere else).

  // Fetch similar cars from same dealer or same make
  const similar = await db.car.findMany({
    where: {
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
      id:        { not: car.id },
      OR: [
        { dealerId: car.dealerId },
        { make: car.make },
      ],
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      dealer: { select: { id: true, name: true, slug: true, location: true, verified: true } },
    },
    take: 4,
    orderBy: { featured: "desc" },
  });

  return NextResponse.json(
    { car, similar },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
