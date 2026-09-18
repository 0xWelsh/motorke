// src/app/api/admin/cars/[id]/route.js  — PUT (update)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";
import { mapCarImagesWithAlt } from "@/lib/car-listing-seo";
import { matchCarToSearchAlerts } from "@/lib/search-alerts";

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const car = await db.car.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  return NextResponse.json(car);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      make, model, variant, year, price, mileage, vehicleType,
      fuelType, transmission, bodyType, engineCC, drivetrain, steering,
      cylinders, horsepower, torque, turbo, sunroof, airbags,
      color, seats, description, features, badges, images,
      negotiable, imported, featured, registered, dealerId, videoUrl, location, importCountry, dutyPaid,
      isLuxury,
    } = body;
    console.log("🏁 UPDATE CAR IMAGES:", images?.map(img => ({ primary: img.isPrimary, url: img.url.split("/").pop() })));

    // Track price changes
    const existing = await db.car.findUnique({ where: { id }, select: { price: true } });
    const newPrice = price != null && String(price).trim() !== "" ? parseInt(price) : 0;
    if (existing && existing.price !== newPrice && newPrice > 0) {
      await db.carPriceChange.create({
        data: { carId: id, oldPrice: existing.price, newPrice },
      });
    }

    // Update car fields
    await db.car.update({
      where: { id: id },
      data: {
        dealerId,
        vehicleType:  vehicleType || "CAR",
        make:         make.trim(),
        model:        model.trim(),
        variant:      variant?.trim() || null,
        year:         parseInt(year),
        price: newPrice,
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
        dutyPaid:     dutyPaid === false || dutyPaid === "false" ? false : true,
        registered:   registered === false || registered === "false" ? false : true,
        imported:     Boolean(imported),
        importCountry: importCountry?.trim() || null,
        location:     location?.trim() || null,
        featured:     Boolean(featured),
        isLuxury:     Boolean(isLuxury),
      },
    });

    // Replace images if provided
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

    await revalidateInventoryForCar(id, { refreshHomepage: true });
    
    // Trigger WhatsApp alerts for matching buyers
    matchCarToSearchAlerts(id).catch(e => console.error("Admin Match Alert Error:", e));

    return NextResponse.json({ success: true, redirectTo: "/admin/cars" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
