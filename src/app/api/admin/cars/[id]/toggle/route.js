// src/app/api/admin/cars/[id]/toggle/route.js
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || !["ADMIN","DEALER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const car = await db.car.findUnique({ where: { id: id } });
  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Dealers can only toggle their own cars
  if (session.user.role === "DEALER" && car.dealerId !== session.user.dealerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.car.update({
    where: { id: id },
    data:  { available: !car.available },
  });

  return NextResponse.redirect(new URL(request.headers.get("referer") || "/admin/cars", request.url));
}
