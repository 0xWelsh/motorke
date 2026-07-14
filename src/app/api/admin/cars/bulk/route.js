export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { deleteImage } from "@/lib/storage";
import { NextResponse } from "next/server";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { ids, action } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No car IDs provided" }, { status: 400 });
  }
  if (!["toggle", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const cars = await db.car.findMany({
    where: { id: { in: ids } },
    include: { images: true },
  });

  if (cars.length === 0) {
    return NextResponse.json({ error: "No cars found" }, { status: 404 });
  }

  if (action === "toggle") {
    const allAvailable = cars.every((c) => c.available);
    await db.car.updateMany({
      where: { id: { in: ids } },
      data: { available: !allAvailable },
    });
    for (const car of cars) {
      await revalidateInventoryForCar(car.id, { refreshHomepage: true });
    }
    return NextResponse.json({ success: true, updated: ids.length, madeAvailable: !allAvailable });
  }

  if (action === "delete") {
    for (const car of cars) {
      for (const img of car.images) {
        await deleteImage(img.url).catch(() => {});
      }
      await revalidateInventoryForCar(car.id, { refreshHomepage: true });
    }
    await db.lead.deleteMany({ where: { carId: { in: ids } } });
    await db.carImage.deleteMany({ where: { carId: { in: ids } } });
    await db.car.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ success: true, deleted: ids.length });
  }
}
