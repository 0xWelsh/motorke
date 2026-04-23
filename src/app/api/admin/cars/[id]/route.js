import { computeLandedPriceForDb } from "@/lib/duty";
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
      negotiable, dutyPaid, imported, featured, dealerId, videoUrl,
    } = body;
    console.log("🏁 UPDATE CAR IMAGES:", images?.map(img => ({ primary: img.isPrimary, url: img.url.split("/").pop() })));

    // Update car fields
    await db.car.update({
      where: { id: id },
      data: {
        dealerId,
        make:         make.trim(),
        model:        model.trim(),
        variant:      variant?.trim() || null,
        year:         parseInt(year),
        price: parseInt(price),
      computedLandedPrice: await computeLandedPriceForDb(parseInt(price), dutyPaid, year, engineCC, fuelType),
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
        videoUrl:     videoUrl?.trim() || null,
        negotiable:   Boolean(negotiable),
        dutyPaid:     Boolean(dutyPaid),
        imported:     Boolean(imported),
        featured:     Boolean(featured),
      },
    });

    // Replace images if provided
    if (images && images.length > 0) {
      await db.carImage.deleteMany({ where: { carId: id } });
      const primaryIdx = images.findIndex(img => img.isPrimary);
      const finalPrimaryIdx = primaryIdx !== -1 ? primaryIdx : 0;
      await db.carImage.createMany({
        data: images.map((img, i) => ({
          carId:     id,
          url:       img.url,
          isPrimary: i === finalPrimaryIdx,
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
