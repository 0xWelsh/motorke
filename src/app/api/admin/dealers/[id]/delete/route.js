// src/app/api/admin/dealers/[id]/delete/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Delete in order: leads → car images → cars → sessions → users → dealer
    const cars = await db.car.findMany({
      where:  { dealerId: id },
      select: { id: true },
    });
    const carIds = cars.map((c) => c.id);

    await db.lead.deleteMany({ where: { dealerId: id } });
    await db.carImage.deleteMany({ where: { carId: { in: carIds } } });
    await db.car.deleteMany({ where: { dealerId: id } });

    // Kill sessions for dealer users before deleting
    const users = await db.user.findMany({
      where:  { dealerId: id },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await db.session.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { dealerId: id } });

    await db.dealer.delete({ where: { id: id } });

    return NextResponse.redirect(new URL("/admin/dealers", request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(
      new URL(`/admin/dealers/${id}/edit?error=1`, request.url)
    );
  }
}
