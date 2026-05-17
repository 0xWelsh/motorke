export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { findSimilarStock, serializeSimilarStockCar } from "@/lib/duty-similar-stock";
import { carsHubPathForDutyVehicle } from "@/lib/duty-vehicle-slug";

const querySchema = z.object({
  make: z.string().min(1).max(80),
  model: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(8).optional().default(4),
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    make: searchParams.get("make") || "",
    model: searchParams.get("model") || undefined,
    limit: searchParams.get("limit") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ cars: [], hubPath: "/cars" }, { status: 400 });
  }

  const { make, model, limit } = parsed.data;
  const cars = await findSimilarStock({ make, model, limit });
  const hubPath = carsHubPathForDutyVehicle({ make, model: model || "" });

  return NextResponse.json({
    make,
    model: model || null,
    hubPath,
    cars: cars.map(serializeSimilarStockCar),
  });
}
