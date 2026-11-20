// src/app/api/cars/[id]/gallery/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Ordered image urls for a single listing. Cards ship only the primary
// image in list payloads; spotlight cards pull their slideshow from here.
export async function GET(req, { params }) {
  const { id } = await params;
  try {
    const car = await db.car.findUnique({
      where: { id },
      select: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }, { id: "asc" }],
          take: 6,
          select: { url: true },
        },
      },
    });
    const urls = (car?.images || []).map((i) => i.url).filter(Boolean);
    return NextResponse.json(
      { urls },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } },
    );
  } catch {
    return NextResponse.json({ urls: [] });
  }
}
