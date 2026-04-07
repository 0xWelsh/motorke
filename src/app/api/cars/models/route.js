export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const VPIC_MODELS_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake";

const querySchema = z.object({
  make: z.string().min(1).max(80),
  limit: z.coerce.number().int().positive().max(300).optional().default(150),
});

function uniqueSorted(values) {
  const map = new Map();
  values.forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (!map.has(key)) map.set(key, normalized);
  });
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

async function fetchVpicModels(make) {
  try {
    const res = await fetch(`${VPIC_MODELS_URL}/${encodeURIComponent(make)}?format=json`, {
      cache: "no-store",
    });
    if (!res.ok) return [];

    const payload = await res.json();
    const rows = Array.isArray(payload?.Results) ? payload.Results : [];

    return uniqueSorted(rows.map((row) => row?.Model_Name));
  } catch {
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { make, limit } = parsed.data;

  const rows = await db.car.findMany({
    where: {
      make: { equals: make, mode: "insensitive" },
      available: true,
    },
    select: { model: true },
    distinct: ["model"],
    take: limit * 2,
  });

  const inventoryModels = uniqueSorted(rows.map((row) => row.model));
  const vpicModels = inventoryModels.length < limit ? await fetchVpicModels(make) : [];
  const models = uniqueSorted([...inventoryModels, ...vpicModels]).slice(0, limit);

  const sources = ["inventory", ...(vpicModels.length > 0 ? ["vpic"] : [])];

  return NextResponse.json({
    make,
    count: models.length,
    models,
    inventoryCount: inventoryModels.length,
    internetCount: vpicModels.length,
    sources,
  });
}
