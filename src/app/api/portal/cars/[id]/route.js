// src/app/api/portal/cars/[id]/route.js  — PUT (dealer updates car)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";
import { mapCarImagesWithAlt } from "@/lib/car-listing-seo";

export async function PUT(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Verify this car belongs to the dealer
  const existing = await db.car.findUnique({ where: { id: id } });
  if (!existing || existing.dealerId !== session.user.dealerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      make, model, variant, year, price, mileage, condition,
      fuelType, transmission, bodyType, engineCC, drivetrain, steering,
      groundClearanceMm, hybridBatteryTech, spareAvailability,
      cylinders, horsepower, torque, turbo, sunroof, airbags,
      color, seats, description, features, badges, images,
      negotiable, imported, registered,
    } = body;
    console.log("🏁 PORTAL UPDATE CAR IMAGES:", images?.map(img => ({ primary: img.isPrimary, url: img.url.split("/").pop() })));

    await db.car.update({
      where: { id: id },
      data: {
        make:         make.trim(),
        model:        model.trim(),
        variant:      variant?.trim() || null,
        year:         parseInt(year),
        price: parseInt(price),
        mileage:      mileage ? parseInt(mileage) : null,
        condition:    condition || "USED",
        fuelType,
        transmission,
        bodyType,
        engineCC:     engineCC ? parseInt(engineCC) : null,
        groundClearanceMm: groundClearanceMm ? parseInt(groundClearanceMm) : null,
        hybridBatteryTech: hybridBatteryTech || null,
        spareAvailability: spareAvailability ? parseInt(spareAvailability) : null,
        cylinders:    cylinders ? parseInt(cylinders) : null,
        horsepower:   horsepower ? parseInt(horsepower) : null,
        torque:       torque ? parseInt(torque) : null,
        drivetrain:   drivetrain || "FWD",
        steering:     steering || "RHD",
        turbo:        Boolean(turbo),
        sunroof:      Boolean(sunroof),
        airbags:      airbags ? parseInt(airbags) : 0,
        color:        color?.trim() || null,
        seats:        seats ? parseInt(seats) : null,
        description:  description?.trim() || null,
        features:     Array.isArray(features) ? features : [],
        badges:       Array.isArray(badges) ? badges : [],
        negotiable:   Boolean(negotiable),
        dutyPaid:     true,
        registered:   registered === false || registered === "false" ? false : true,
        imported:     Boolean(imported),
        // featured intentionally excluded — only admin can change
      },
    });

    // Replace images if new ones provided
    if (images && images.length > 0) {
      const carForAlt = await db.car.findUnique({
        where: { id },
        select: {
          year: true,
          make: true,
          model: true,
          variant: true,
          engineCC: true,
          fuelType: true,
          bodyType: true,
        },
      });
      await db.carImage.deleteMany({ where: { carId: id } });
      await db.carImage.createMany({
        data: mapCarImagesWithAlt(carForAlt || {}, images).map((row) => ({
          carId: id,
          ...row,
        })),
      });
    }

    await revalidateInventoryForCar(id);

    return NextResponse.json({ success: true, redirectTo: "/portal" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
