// src/app/api/portal/cars/[id]/status/route.js — POST (toggle car available status)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  
  if (!session || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    // Verify this car belongs to the dealer
    const car = await db.car.findUnique({ where: { id } });
    if (!car || car.dealerId !== session.user.dealerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { available } = await request.json();

    await db.car.update({
      where: { id },
      data: { available: Boolean(available) },
    });

    return NextResponse.json({ success: true, available: Boolean(available) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
