export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

const VALID_FUEL = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"];
const VALID_TRANS = ["AUTOMATIC", "MANUAL", "CVT"];
const VALID_BODY = ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "VAN", "WAGON", "COUPE", "CONVERTIBLE", "BUS", "TRUCK"];
const VALID_DRIVETRAIN = ["FWD", "RWD", "AWD", "FOURWD"];
const VALID_STEERING = ["RHD", "LHD"];
const VALID_HYBRID_BATTERY = ["NIMH", "LI_ION", "OTHER", "NA"];

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
  if (!session || session.user.role !== "DEALER" || !session.user.dealerId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const { rows } = await request.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Missing rows" }, { status: 400 });
    }

    let count = 0;
    const errors = [];

    for (const [i, raw] of rows.entries()) {
      try {
        const row = normalizeRow(raw);

        const fuelType = String(row.fueltype || "PETROL").toUpperCase();
        const transmission = String(row.transmission || "AUTOMATIC").toUpperCase();
        const bodyType = String(row.bodytype || "SEDAN").toUpperCase();
        const drivetrain = String(row.drivetrain || row.drivetype || "FWD").toUpperCase();
        const steering = String(row.steering || "RHD").toUpperCase();
        const hybridBatteryTech = row.hybridbatterytech
          ? String(row.hybridbatterytech).toUpperCase().trim()
          : null;

        if (!row.make || !row.model || !row.year || !row.price) {
          throw new Error("Missing required columns: make, model, year, price");
        }
        if (!VALID_FUEL.includes(fuelType)) throw new Error(`Invalid fuelType: ${fuelType}`);
        if (!VALID_TRANS.includes(transmission)) throw new Error(`Invalid transmission: ${transmission}`);
        if (!VALID_BODY.includes(bodyType)) throw new Error(`Invalid bodyType: ${bodyType}`);
        if (hybridBatteryTech && !VALID_HYBRID_BATTERY.includes(hybridBatteryTech)) {
          throw new Error(`Invalid hybridBatteryTech: ${hybridBatteryTech}`);
        }

        const features = row.features
          ? String(row.features).split(";").map((f) => f.trim()).filter(Boolean)
          : [];

        await db.car.create({
          data: {
            dealerId: session.user.dealerId,
            make: String(row.make).trim(),
            model: String(row.model).trim(),
            variant: row.variant ? String(row.variant).trim() : null,
            year: parseInt(row.year, 10),
            price: parseInt(row.price, 10),
            mileage: row.mileage ? parseInt(row.mileage, 10) : null,
            condition: String(row.condition || "USED").toUpperCase(),
            fuelType,
            transmission,
            bodyType,
            drivetrain: VALID_DRIVETRAIN.includes(drivetrain) ? drivetrain : "FWD",
            steering: VALID_STEERING.includes(steering) ? steering : "RHD",
            engineCC: row.enginecc ? parseInt(row.enginecc, 10) : null,
            groundClearanceMm: row.groundclearancemm ? parseInt(row.groundclearancemm, 10) : null,
            hybridBatteryTech,
            spareAvailability: row.spareavailability ? parseInt(row.spareavailability, 10) : null,
            color: row.color ? String(row.color).trim() : null,
            seats: row.seats ? parseInt(row.seats, 10) : null,
            description: row.description ? String(row.description).trim() : null,
            features,
            negotiable: parseBool(row.negotiable, true),
            dutyPaid: true,
            imported: parseBool(row.imported, true),
            importCountry: row.importcountry ? String(row.importcountry).trim() : "Japan",
            available: true,
            featured: false,
            images: row.imageurl
              ? { create: [{ url: String(row.imageurl).trim(), isPrimary: true, order: 0 }] }
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
    console.error("Dealer bulk upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
