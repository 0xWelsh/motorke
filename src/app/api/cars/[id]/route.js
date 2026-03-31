// src/app/api/cars/[id]/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = await params;
  const car = await db.car.findUnique({
    where: { id: id },
    include: {
      images: { orderBy: { order: "asc" } },
      dealer: true,
    },
  });

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  // Increment view count (fire and forget)
  db.car.update({
    where: { id: id },
    data:  { views: { increment: 1 } },
  }).catch(() => {});

  // Fetch similar cars from same dealer or same make
  const similar = await db.car.findMany({
    where: {
      available: true,
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

  return NextResponse.json({ car, similar });
}
