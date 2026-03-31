// src/app/api/admin/cars/bulk/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const { dealerId, rows } = await request.json();

    if (!dealerId || !rows?.length) {
      return NextResponse.json({ error: "Missing dealerId or rows" }, { status: 400 });
    }

    // Verify dealer exists
    const dealer = await db.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) return NextResponse.json({ error: "Dealer not found" }, { status: 404 });

    const VALID_FUEL  = ["PETROL","DIESEL","HYBRID","ELECTRIC","LPG"];
    const VALID_TRANS = ["AUTOMATIC","MANUAL","CVT"];
    const VALID_BODY  = ["SEDAN","SUV","HATCHBACK","PICKUP","VAN","WAGON","COUPE","CONVERTIBLE","BUS","TRUCK"];
    const VALID_DRIVE = ["RHD","LHD","AWD","FWD","RWD","FOURWD"];

    let count = 0;
    const errors = [];

    for (const [i, row] of rows.entries()) {
      try {
        // Normalize keys (CSV headers may be lowercase)
        const r = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));

        const fuelType     = (r.fueltype || r.fueltype || "PETROL").toUpperCase();
        const transmission = (r.transmission || "AUTOMATIC").toUpperCase();
        const bodyType     = (r.bodytype || "SEDAN").toUpperCase();
        const driveType    = (r.drivetype || "RHD").toUpperCase();

        if (!VALID_FUEL.includes(fuelType))     throw new Error(`Invalid fuelType: ${fuelType}`);
        if (!VALID_TRANS.includes(transmission)) throw new Error(`Invalid transmission: ${transmission}`);
        if (!VALID_BODY.includes(bodyType))      throw new Error(`Invalid bodyType: ${bodyType}`);

        // Parse features (semicolon-separated)
        const features = r.features
          ? r.features.split(";").map(f => f.trim()).filter(Boolean)
          : [];

        const car = await db.car.create({
          data: {
            dealerId,
            make:         r.make?.trim(),
            model:        r.model?.trim(),
            variant:      r.variant?.trim() || null,
            year:         parseInt(r.year),
            price:        parseInt(r.price),
            mileage:      r.mileage ? parseInt(r.mileage) : null,
            fuelType,
            transmission,
            bodyType,
            driveType:    VALID_DRIVE.includes(driveType) ? driveType : "RHD",
            engineCC:     r.enginecc ? parseInt(r.enginecc) : null,
            color:        r.color?.trim() || null,
            seats:        r.seats ? parseInt(r.seats) : null,
            description:  r.description?.trim() || null,
            features,
            negotiable:   true,
            dutyPaid:     r.dutypaid !== "false",
            imported:     r.imported !== "false",
            importCountry: r.importcountry || "Japan",
            available:    true,
            // Create image if URL provided
            images: r.imageurl
              ? { create: [{ url: r.imageurl, isPrimary: true, order: 0 }] }
              : undefined,
          },
        });
        count++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, count, errors });
  } catch (err) {
    console.error("Bulk upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
