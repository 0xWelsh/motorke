// src/app/api/saved/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

// Batch list of the current user's saved car ids, so cards can render the
// heart state without one request per card.
export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ ids: [] });

  const rows = await db.savedCar.findMany({
    where: { userId: session.user.id },
    select: { carId: true },
  });
  return NextResponse.json({ ids: rows.map((r) => r.carId) });
}
