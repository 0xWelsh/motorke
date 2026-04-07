export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const VPIC_MODEL_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakemodel";

const querySchema = z.object({
  make: z.string().min(1).max(80),
  model: z.string().min(1).max(120),
  limit: z.coerce.number().int().positive().max(300).optional().default(120),
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

function extractVariantFromModelName(modelName, selectedModel) {
  const full = String(modelName || "").trim();
  const model = String(selectedModel || "").trim();
  if (!full || !model) return "";

  const fullLower = full.toLowerCase();
  const modelLower = model.toLowerCase();

  if (fullLower === modelLower) return "";
  if (fullLower.startsWith(`${modelLower} `)) {
    return full.slice(model.length).trim();
  }
  return full;
}

async function fetchVpicVariantCandidates(make, model) {
  try {
    const res = await fetch(
      `${VPIC_MODEL_URL}/${encodeURIComponent(make)}/${encodeURIComponent(model)}?format=json`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];

    const payload = await res.json();
    const rows = Array.isArray(payload?.Results) ? payload.Results : [];

    const extracted = rows
      .map((row) => extractVariantFromModelName(row?.Model_Name, model))
      .filter(Boolean);

    return uniqueSorted(extracted);
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

  const { make, model, limit } = parsed.data;

  const rows = await db.car.findMany({
    where: {
      make: { equals: make, mode: "insensitive" },
      model: { equals: model, mode: "insensitive" },
      available: true,
      NOT: { variant: null },
    },
    select: { variant: true },
    distinct: ["variant"],
    take: limit * 2,
  });

  const inventoryVariants = uniqueSorted(rows.map((row) => row.variant));
  const vpicVariants = inventoryVariants.length < limit ? await fetchVpicVariantCandidates(make, model) : [];
  const variants = uniqueSorted([...inventoryVariants, ...vpicVariants]).slice(0, limit);

  const sources = ["inventory", ...(vpicVariants.length > 0 ? ["vpic"] : [])];

  return NextResponse.json({
    make,
    model,
    count: variants.length,
    variants,
    inventoryCount: inventoryVariants.length,
    internetCount: vpicVariants.length,
    sources,
  });
}
