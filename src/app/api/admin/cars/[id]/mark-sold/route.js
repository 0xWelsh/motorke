export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";
import { setCarAvailability } from "@/lib/set-car-availability";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const car = await db.car.findUnique({ where: { id } });
  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.car.update({
    where: { id },
    data: { available: false, soldAt: new Date() },
  });

  await revalidateInventoryForCar(id, { refreshHomepage: true });

  return NextResponse.redirect(new URL(request.headers.get("referer") || "/admin/cars", request.url));
}
