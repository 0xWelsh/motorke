// src/app/api/portal/cars/[id]/route.js  — PUT (dealer updates car)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

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
      make, model, variant, year, price, mileage,
      fuelType, transmission, bodyType, engineCC, drivetrain, steering,
      cylinders, horsepower, torque, turbo, sunroof, airbags,
      color, seats, description, features, badges, images,
      negotiable, dutyPaid, imported,
    } = body;

    await db.car.update({
      where: { id: id },
      data: {
        make:         make.trim(),
        model:        model.trim(),
        variant:      variant?.trim() || null,
        year:         parseInt(year),
        price:        parseInt(price),
        mileage:      mileage ? parseInt(mileage) : null,
        fuelType,
        transmission,
        bodyType,
        engineCC:     engineCC ? parseInt(engineCC) : null,
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
        dutyPaid:     Boolean(dutyPaid),
        imported:     Boolean(imported),
        // featured intentionally excluded — only admin can change
      },
    });

    // Replace images if new ones provided
    if (images && images.length > 0) {
      await db.carImage.deleteMany({ where: { carId: id } });
      await db.carImage.createMany({
        data: images.map((img, i) => ({
          carId:     id,
          url:       img.url,
          isPrimary: img.isPrimary || i === 0,
          order:     i,
        })),
      });
    }

    return NextResponse.json({ success: true, redirectTo: "/portal" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
