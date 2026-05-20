export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  computeDutyEstimate,
  getDutyVehicleById,
  recordDutyCalculation,
} from "@/lib/duty-calculator-service";
import { dutyVehicleLabel } from "@/lib/duty-vehicle-slug";

const bodySchema = z.object({
  vehicleId: z.string().optional(),
  crspKes: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
  engineCC: z.coerce.number().int().min(600).max(8000).optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"]).optional(),
  make: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
  trim: z.string().max(80).optional(),
  searchQuery: z.string().max(120).optional(),
  sessionKey: z.string().max(64).optional(),
  /** Overseas purchase / CIF in KES — for all-in landed estimate (not CRSP). */
  purchasePriceKes: z.coerce.number().int().positive().optional(),
});

export async function POST(request) {
  let json;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  let vehicle = null;

  if (data.vehicleId) {
    vehicle = await getDutyVehicleById(data.vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
  }

  const crspKes = vehicle?.crspKes ?? data.crspKes;
  const year = vehicle?.year ?? data.year;
  const engineCC = vehicle?.engineCC ?? data.engineCC;
  const fuelType = vehicle?.fuelType ?? data.fuelType;

  if (!crspKes || !year || !engineCC || !fuelType) {
    return NextResponse.json(
      { error: "Provide vehicleId or crspKes, year, engineCC, and fuelType" },
      { status: 400 },
    );
  }

  const result = await computeDutyEstimate({
    dutyVehicleId: vehicle?.id,
    make: vehicle?.make ?? data.make,
    model: vehicle?.model ?? data.model,
    trim: vehicle?.trim ?? data.trim,
    year,
    engineCC,
    fuelType,
    crspKes,
    purchasePriceKes: data.purchasePriceKes,
    slug: vehicle?.slug,
    label: vehicle ? dutyVehicleLabel(vehicle) : undefined,
  });

  // Log in background so navigation is not blocked waiting on DB write.
  void recordDutyCalculation(
    {
      dutyVehicleId: vehicle?.id,
      make: result.make,
      model: result.model,
      year: result.year,
      engineCC: result.engineCC,
      fuelType: result.fuelType,
      crspKes: result.crspKes,
      breakdown: result.breakdown,
    },
    { searchQuery: data.searchQuery, sessionKey: data.sessionKey },
  );

  return NextResponse.json({
    vehicle: vehicle
      ? { id: vehicle.id, slug: vehicle.slug, label: dutyVehicleLabel(vehicle) }
      : null,
    estimate: result,
  });
}
