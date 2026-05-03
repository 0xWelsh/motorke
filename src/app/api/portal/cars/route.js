// src/app/api/portal/cars/route.js  — POST (dealer creates car)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { trackRequest } from "@/lib/telemetry";
import { logAuditEvent } from "@/lib/audit-trail";

export async function POST(request) {
  const started = Date.now();
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "DEALER") {
    trackRequest({
      route: "/api/portal/cars",
      method: "POST",
      status: 401,
      durationMs: Date.now() - started,
      ok: false,
      errorMessage: "Unauthorised",
    });
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!session.user.dealerId) {
    trackRequest({
      route: "/api/portal/cars",
      method: "POST",
      status: 400,
      durationMs: Date.now() - started,
      ok: false,
      errorMessage: "Dealer profile not linked",
    });
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
    logAuditEvent({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "car.create",
      entity: "car",
      entityId: car.id,
      detail: { dealerId: car.dealerId, source: "portal" },
    });
    trackRequest({
      route: "/api/portal/cars",
      method: "POST",
      status: 201,
      durationMs: Date.now() - started,
      ok: true,
    });
    return NextResponse.json(
      { success: true, redirectTo: `/portal?created=1&car=${car.id}` },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    trackRequest({
      route: "/api/portal/cars",
      method: "POST",
      status: 500,
      durationMs: Date.now() - started,
      ok: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
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
    negotiable, imported, featured, registered,
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
      registered:   registered === false || registered === "false" ? false : true,
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
