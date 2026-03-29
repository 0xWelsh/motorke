// src/app/api/portal/cars/route.js  — POST (dealer creates car)
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Force the dealerId to be the dealer's own — never trust client input
    body.dealerId = session.user.dealerId;

    const car = await createCarRecord(body);
    return NextResponse.json(
      { success: true, redirectTo: "/portal" },
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
    fuelType, transmission, bodyType, engineCC, driveType,
    color, seats, description, features, badges, images,
    negotiable, dutyPaid, imported, featured,
  } = body;

  return db.car.create({
    data: {
      dealerId,
      make:         make.trim(),
      model:        model.trim(),
      variant:      variant?.trim() || null,
      year:         parseInt(year),
      price:        parseInt(price),
      mileage:      mileage ? parseInt(mileage) : null,
      fuelType:     fuelType || "PETROL",
      transmission: transmission || "AUTOMATIC",
      bodyType:     bodyType || "SEDAN",
      engineCC:     engineCC ? parseInt(engineCC) : null,
      driveType:    driveType || "RHD",
      color:        color?.trim() || null,
      seats:        seats ? parseInt(seats) : null,
      description:  description?.trim() || null,
      features:     Array.isArray(features) ? features : [],
      badges:       Array.isArray(badges) ? badges : [],
      negotiable:   Boolean(negotiable),
      dutyPaid:     Boolean(dutyPaid),
      imported:     Boolean(imported),
      importCountry: imported ? "Japan" : null,
      featured:     false,   // Dealers can't self-feature — admin controls this
      available:    true,
      images: images?.length
        ? {
            create: images.map((img, i) => ({
              url:       img.url,
              isPrimary: img.isPrimary || i === 0,
              order:     i,
            })),
          }
        : undefined,
    },
  });
}
