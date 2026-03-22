// src/app/api/admin/cars/clear/route.js
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Optional: filter by dealerId
  const { dealerId } = await request.json().catch(() => ({}));
  const where = dealerId ? { dealerId } : {};

  await db.savedCar.deleteMany({ where: { car: where } });
  await db.lead.deleteMany({ where });
  await db.carImage.deleteMany({ where: { car: where } });
  const { count } = await db.car.deleteMany({ where });

  return NextResponse.json({ success: true, count });
}