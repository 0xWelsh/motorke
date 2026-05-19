// src/app/api/cars/bulk/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MIN_BULK_UPLOAD_CARS } from "@/lib/bulk-upload-policy";
import { finalizeNewCarPublicSlug } from "@/lib/car-public-slug";
import { revalidateInventory } from "@/lib/revalidate-inventory";

const VALID_FUEL = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"];
const VALID_TRANS = ["AUTOMATIC", "MANUAL", "CVT"];
const VALID_BODY = ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "VAN", "WAGON", "COUPE", "CONVERTIBLE", "CROSSOVER", "MPV", "MINIVAN", "ROADSTER", "LIFTBACK", "BUS", "TRUCK"];
const VALID_DRIVETRAIN = ["FWD", "RWD", "AWD", "FOURWD"];
const VALID_STEERING = ["RHD", "LHD"];

function normalizeRow(raw) {
  return Object.fromEntries(Object.entries(raw || {}).map(([k, v]) => [k.toLowerCase(), v]));
}

function parseBool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).toLowerCase();
  return !(normalized === "false" || normalized === "0" || normalized === "no");
}

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const { dealerId, rows } = await request.json();

    if (!dealerId || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Missing dealerId or rows" }, { status: 400 });
    }
    if (rows.length < MIN_BULK_UPLOAD_CARS) {
      return NextResponse.json(
        { error: `Bulk import must include at least ${MIN_BULK_UPLOAD_CARS} cars.` },
        { status: 400 }
      );
    }

    // Verify dealer exists
    const dealer = await db.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) return NextResponse.json({ error: "Dealer not found" }, { status: 404 });

    let count = 0;
    const errors = [];

    for (const [i, row] of rows.entries()) {
      try {
        const r = normalizeRow(row);

        const fuelType = String(r.fueltype || "PETROL").toUpperCase();
        const transmission = String(r.transmission || "AUTOMATIC").toUpperCase();
        const bodyType = String(r.bodytype || "SEDAN").toUpperCase();
        const drivetrain = String(r.drivetrain || r.drivetype || "FWD").toUpperCase();
        const steering = String(r.steering || "RHD").toUpperCase();

        if (!r.make || !r.model || !r.year || !r.price) {
          throw new Error("Missing required columns: make, model, year, price");
        }

        if (!VALID_FUEL.includes(fuelType))     throw new Error(`Invalid fuelType: ${fuelType}`);
        if (!VALID_TRANS.includes(transmission)) throw new Error(`Invalid transmission: ${transmission}`);
        if (!VALID_BODY.includes(bodyType))      throw new Error(`Invalid bodyType: ${bodyType}`);

        // Parse features (semicolon-separated)
        const features = r.features
          ? r.features.split(";").map(f => f.trim()).filter(Boolean)
          : [];

        let car = await db.car.create({
          data: {
            dealerId,
            make:         r.make?.trim(),
            model:        r.model?.trim(),
            variant:      r.variant?.trim() || null,
            year:         parseInt(r.year),
            price:        parseInt(r.price),
            mileage:      r.mileage ? parseInt(r.mileage) : null,
            condition:    String(r.condition || "USED").toUpperCase(),
            fuelType,
            transmission,
            bodyType,
            drivetrain:   VALID_DRIVETRAIN.includes(drivetrain) ? drivetrain : "FWD",
            steering:     VALID_STEERING.includes(steering) ? steering : "RHD",
            engineCC:     r.enginecc ? parseInt(r.enginecc) : null,
            color:        r.color?.trim() || null,
            seats:        r.seats ? parseInt(r.seats) : null,
            description:  r.description?.trim() || null,
            features,
            negotiable:   parseBool(r.negotiable, true),
            dutyPaid:     true,
            registered:   parseBool(r.registered, true),
            imported:     parseBool(r.imported, true),
            importCountry: r.importcountry || "Japan",
            available:    true,
            // Create image if URL provided
            images: r.imageurl
              ? { create: [{ url: r.imageurl, isPrimary: true, order: 0 }] }
              : undefined,
          },
        });
        car = await finalizeNewCarPublicSlug(car);
        count++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    revalidateInventory({ refreshHomepage: true });

    return NextResponse.json({ success: true, count, errors });
  } catch (err) {
    console.error("Bulk upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
