// src/app/api/portal/cars/route.js  — POST (dealer creates car)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!session.user.dealerId) {
    return NextResponse.json({ error: "Dealer profile is not linked to this account" }, { status: 400 });
  }

  try {
    const body = await request.json();

    if (!body?.make || !body?.model || !body?.year || !body?.price) {
      return NextResponse.json(
        { error: "Missing required fields: make, model, year, price" },
        { status: 400 }
      );
    }

    // Force the dealerId to be the dealer's own — never trust client input
    body.dealerId = session.user.dealerId;

    const car = await createCarRecord(body);
    return NextResponse.json(
      { success: true, redirectTo: `/portal?created=1&car=${car.id}` },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function createCarRecord(body) {
  const {
    dealerId, make, model, variant, year, price, mileage,
    condition,
    fuelType, transmission, bodyType, engineCC, drivetrain, steering,
    groundClearanceMm, hybridBatteryTech, spareAvailability,
    cylinders, horsepower, torque, turbo, sunroof, airbags,
    color, seats, description, features, badges, images,
    negotiable, imported, featured,
  } = body;
  console.log("🏁 PORTAL CREATE CAR IMAGES:", images?.map(img => ({ primary: img.isPrimary, url: img.url.split("/").pop() })));

  return db.car.create({
    data: {
      dealerId,
      make:         make.trim(),
      model:        model.trim(),
      variant:      variant?.trim() || null,
      year:         parseInt(year),
      price: parseInt(price),
      mileage:      mileage ? parseInt(mileage) : null,
      condition:    condition || "USED",
      fuelType:     fuelType || "PETROL",
      transmission: transmission || "AUTOMATIC",
      bodyType:     bodyType || "SEDAN",
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
      imported:     Boolean(imported),
      importCountry: imported ? "Japan" : null,
      featured:     false,   // Dealers can't self-feature — admin controls this
      available:    true,
      images: images?.length
        ? {
            create: (() => {
              const primaryIdx = images.findIndex(img => img.isPrimary);
              const finalPrimaryIdx = primaryIdx !== -1 ? primaryIdx : 0;
              return images.map((img, i) => ({
                url:       img.url,
                isPrimary: i === finalPrimaryIdx,
                order:     i,
              }));
            })(),
          }
        : undefined,
    },
  });
}
