export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  spotlightActivationData,
  spotlightDeactivationData,
} from "@/lib/spotlight";

/**
 * Admin-only: grant or revoke paid Spotlight on a listing (for testing before billing).
 * POST body: { days: 7 } to activate, { days: 0 } to clear.
 */
export async function POST(request, { params }) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const days = Number(body.days);

  if (!id) {
    return NextResponse.json({ error: "Missing car id" }, { status: 400 });
  }

  const data =
    days > 0 ? spotlightActivationData(days) : spotlightDeactivationData();

  const car = await db.car.update({
    where: { id },
    data,
    select: { id: true, make: true, model: true, spotlightUntil: true, featuredWeight: true },
  });

  return NextResponse.json({ success: true, car });
}
