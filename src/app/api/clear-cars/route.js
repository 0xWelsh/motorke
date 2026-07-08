import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const AUTH_TOKEN = "bidgari-clear-2026";

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db.$transaction(async (tx) => {
    const carCount = await tx.car.count();
    const imageCount = await tx.carImage.count();

    await tx.lead.deleteMany({});
    await tx.carReview.deleteMany({});
    await tx.carView.deleteMany({});
    await tx.savedCar.deleteMany({});
    await tx.searchAlert.deleteMany({});
    await tx.listingBoostEvent.deleteMany({});
    await tx.carImage.deleteMany({});
    await tx.car.deleteMany({});

    return { carsDeleted: carCount, imagesDeleted: imageCount };
  });

  return NextResponse.json(result);
}

export async function GET() {
  const counts = await db.$transaction(async (tx) => ({
    cars: await tx.car.count(),
    images: await tx.carImage.count(),
    leads: await tx.lead.count(),
    reviews: await tx.carReview.count(),
    views: await tx.carView.count(),
    saved: await tx.savedCar.count(),
    alerts: await tx.searchAlert.count(),
    boosts: await tx.listingBoostEvent.count(),
  }));
  return NextResponse.json(counts);
}
