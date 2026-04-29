// src/app/api/admin/cars/route.js  — POST (create)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { trackRequest } from "@/lib/telemetry";
import { logAuditEvent } from "@/lib/audit-trail";

export async function POST(request) {
  const started = Date.now();
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    trackRequest({
      route: "/api/admin/cars",
      method: "POST",
      status: 401,
      durationMs: Date.now() - started,
      ok: false,
      errorMessage: "Unauthorised",
    });
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const car = await createCar(body);
    logAuditEvent({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "car.create",
      entity: "car",
      entityId: car.id,
      detail: { dealerId: car.dealerId, source: "admin" },
    });
    trackRequest({
      route: "/api/admin/cars",
      method: "POST",
      status: 201,
      durationMs: Date.now() - started,
      ok: true,
    });
    return NextResponse.json({ success: true, redirectTo: `/admin/cars` }, { status: 201 });
  } catch (err) {
    console.error(err);
    trackRequest({
      route: "/api/admin/cars",
      method: "POST",
      status: 500,
      durationMs: Date.now() - started,
      ok: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Shared create logic (used by admin and dealer portal)
export async function createCar(body) {
  const {
    dealerId, make, model, variant, year, price, mileage,
    fuelType, transmission, bodyType, engineCC, drivetrain, steering,
    cylinders, horsepower, torque, turbo, sunroof, airbags,
    color, seats, description, features, badges, images, videoUrl,
    negotiable, imported, featured,
  } = body;
  console.log("🏁 CREATE CAR IMAGES:", images?.map(img => ({ primary: img.isPrimary, url: img.url.split("/").pop() })));

  return db.car.create({
    data: {
      dealerId,
      make:         make.trim(),
      model:        model.trim(),
      variant:      variant?.trim() || null,
      year:         parseInt(year),
      price: parseInt(price),
      mileage:      mileage ? parseInt(mileage) : null,
      fuelType:     fuelType || "PETROL",
      transmission: transmission || "AUTOMATIC",
      bodyType:     bodyType || "SEDAN",
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
      dutyPaid:     true,
      imported:     Boolean(imported),
      importCountry: imported ? "Japan" : null,
      featured:     Boolean(featured),
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
