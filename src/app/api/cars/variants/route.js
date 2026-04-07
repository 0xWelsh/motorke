export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const VPIC_MODEL_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakemodel";
const FUEL_ECON_OPTIONS_URL = "https://www.fueleconomy.gov/ws/rest/vehicle/menu/options";
const CARQUERY_URL = "https://www.carqueryapi.com/api/0.3/";

const querySchema = z.object({
  make: z.string().min(1).max(80),
  model: z.string().min(1).max(120),
  year: z.coerce.number().int().min(1980).max(2100).optional(),
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

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractFuelEconomyOptions(xml) {
  const matches = xml.matchAll(/<text>([\s\S]*?)<\/text>/gi);
  const options = [];
  for (const match of matches) {
    const decoded = decodeXmlEntities(match[1]).trim();
    if (!decoded) continue;
    if (/^Select\s+/i.test(decoded)) continue;
    options.push(decoded);
  }
  return uniqueSorted(options);
}

async function fetchFuelEconomyVariants(make, model, year) {
  if (!year) return [];

  const yearsToTry = [year, year - 1, year + 1].filter((y, idx, arr) => y >= 1980 && arr.indexOf(y) === idx);
  const merged = [];

  for (const y of yearsToTry) {
    try {
      const url = `${FUEL_ECON_OPTIONS_URL}?year=${y}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const xml = await res.text();
      merged.push(...extractFuelEconomyOptions(xml));
    } catch {
      // Skip failed source/year calls and continue aggregating.
    }
  }

  return uniqueSorted(merged);
}

function parseJsonOrJsonp(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) return null;
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

async function fetchCarQueryVariants(make, model, year) {
  try {
    const params = new URLSearchParams({
      cmd: "getTrims",
      make,
      model,
      sold_in_us: "1",
      full_results: "0",
    });
    if (year) params.set("year", String(year));

    const res = await fetch(`${CARQUERY_URL}?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];

    const text = await res.text();
    const payload = parseJsonOrJsonp(text);
    const rows = Array.isArray(payload?.Trims)
      ? payload.Trims
      : Array.isArray(payload?.carquery?.Trims)
        ? payload.carquery.Trims
        : [];

    return uniqueSorted(
      rows.map((row) => row?.model_trim || row?.trim || row?.model_variant || "")
    );
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

  const { make, model, year, limit } = parsed.data;

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
  const shouldFetchExternal = inventoryVariants.length < limit;
  const [vpicVariants, fuelEconomyVariants, carQueryVariants] = shouldFetchExternal
    ? await Promise.all([
        fetchVpicVariantCandidates(make, model),
        fetchFuelEconomyVariants(make, model, year),
        fetchCarQueryVariants(make, model, year),
      ])
    : [[], [], []];

  const variants = uniqueSorted([
    ...inventoryVariants,
    ...vpicVariants,
    ...fuelEconomyVariants,
    ...carQueryVariants,
  ]).slice(0, limit);

  const sources = [
    "inventory",
    ...(vpicVariants.length > 0 ? ["vpic"] : []),
    ...(fuelEconomyVariants.length > 0 ? ["fueleconomy"] : []),
    ...(carQueryVariants.length > 0 ? ["carquery"] : []),
  ];

  return NextResponse.json({
    make,
    model,
    year: year ?? null,
    count: variants.length,
    variants,
    inventoryCount: inventoryVariants.length,
    internetCount: vpicVariants.length + fuelEconomyVariants.length + carQueryVariants.length,
    vpicCount: vpicVariants.length,
    fuelEconomyCount: fuelEconomyVariants.length,
    carQueryCount: carQueryVariants.length,
    sources,
  });
}
