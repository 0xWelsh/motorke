// src/app/api/portal/cars/[id]/status/route.js — POST (toggle car available status)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";
import { setCarAvailability } from "@/lib/set-car-availability";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  
  if (!session || !["DEALER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    // Verify this car belongs to the dealer
    const car = await db.car.findUnique({ where: { id } });
    if (
      session.user.role === "DEALER" &&
      (!car || car.dealerId !== session.user.dealerId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!car) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { available } = await request.json();
    const nextAvailable = Boolean(available);

    const updated = await setCarAvailability(id, nextAvailable);

    await revalidateInventoryForCar(id, { refreshHomepage: true });

    return NextResponse.json({
      success: true,
      available: updated.available,
      soldAt: updated.soldAt,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
