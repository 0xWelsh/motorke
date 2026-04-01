// src/app/api/admin/cars/[id]/route.js  — PUT (update)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      make, model, variant, year, price, mileage,
      fuelType, transmission, bodyType, engineCC, drivetrain, steering,
      cylinders, horsepower, torque, turbo, sunroof, airbags,
      color, seats, description, features, badges, images,
      negotiable, dutyPaid, imported, featured, dealerId,
    } = body;

    // Update car fields
    await db.car.update({
      where: { id: id },
      data: {
        dealerId,
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
        featured:     Boolean(featured),
      },
    });

    // Replace images if provided
    if (images && images.length > 0) {
      await db.carImage.deleteMany({ where: { carId: id } });
      const hasPrimary = images.some(img => img.isPrimary);
      await db.carImage.createMany({
        data: images.map((img, i) => ({
          carId:     id,
          url:       img.url,
          isPrimary: hasPrimary ? !!img.isPrimary : i === 0,
          order:     i,
        })),
      });
    }

    return NextResponse.json({ success: true, redirectTo: "/admin/cars" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
