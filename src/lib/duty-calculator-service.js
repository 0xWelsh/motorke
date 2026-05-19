import { db } from "@/lib/db";
import { calculateDutyBreakdown, FREIGHT_PROXY_KES, getAgeYearsFromYear } from "@/lib/duty";
import { getDutyRates } from "@/lib/duty-rates";
import { buildDutyVehicleSlug, dutyVehicleLabel, normalizeDutySlug } from "@/lib/duty-vehicle-slug";

function isDutyDbUnavailable(err) {
  const code = err?.code;
  const msg = String(err?.message || "").toLowerCase();
  return code === "P2021" || msg.includes("duty_vehicles") || msg.includes("does not exist");
}

export async function searchDutyVehicles(query, limit = 12) {
  const q = String(query || "").trim();
  if (q.length < 1) return [];

  const words = q.split(/\s+/).filter(Boolean).slice(0, 4);
  const yearToken = words.find((w) => /^(19|20)\d{2}$/.test(w));
  const textWords = words.filter((w) => w !== yearToken);

  const andClauses = textWords.map((word) => ({
    OR: [
      { make: { contains: word, mode: "insensitive" } },
      { model: { contains: word, mode: "insensitive" } },
      { trim: { contains: word, mode: "insensitive" } },
    ],
  }));

  const where = {
    active: true,
    ...(andClauses.length ? { AND: andClauses } : {}),
    ...(yearToken ? { year: parseInt(yearToken, 10) } : {}),
  };

  try {
    return await db.dutyVehicle.findMany({
      where,
      orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
      take: limit,
    });
  } catch (err) {
    if (!isDutyDbUnavailable(err)) {
      console.error("[duty] searchDutyVehicles:", err?.message || err);
    }
    return [];
  }
}

export async function getDutyVehicleBySlug(slug) {
  const normalized = normalizeDutySlug(slug);
  if (!normalized) return null;

  try {
    const direct = await db.dutyVehicle.findFirst({
      where: { slug: normalized, active: true },
    });
    if (direct) return direct;

    // Fallback when stored slug drifted from make/model/trim/year (re-seed without slug update).
    const vehicles = await db.dutyVehicle.findMany({
      where: { active: true },
    });
    return (
      vehicles.find(
        (row) => normalizeDutySlug(row.slug) === normalized || buildDutyVehicleSlug(row) === normalized,
      ) ?? null
    );
  } catch (err) {
    if (!isDutyDbUnavailable(err)) {
      console.error("[duty] getDutyVehicleBySlug:", err?.message || err);
    }
    return null;
  }
}

export async function getDutyVehicleById(id) {
  if (!id) return null;
  try {
    return await db.dutyVehicle.findFirst({
      where: { id: String(id), active: true },
    });
  } catch (err) {
    if (!isDutyDbUnavailable(err)) {
      console.error("[duty] getDutyVehicleById:", err?.message || err);
    }
    return null;
  }
}

/** Vehicles surfaced as “popular” chips — trending calculations first, then curated imports. */
const FEATURED_POPULAR_SLUGS = [
  "toyota-prado-tx-2018",
  "mazda-cx-5-2018",
  "toyota-harrier-premium-2019",
  "toyota-land-cruiser-v8-2018",
  "subaru-forester-2018",
  "honda-cr-v-2018",
  "toyota-rav4-2019",
  "nissan-x-trail-2018",
];

export function serializeDutyVehicleForClient(vehicle) {
  if (!vehicle) return null;
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    year: vehicle.year,
    engineCC: vehicle.engineCC,
    fuelType: vehicle.fuelType,
    crspKes: vehicle.crspKes,
    slug: buildDutyVehicleSlug(vehicle) || vehicle.slug,
    label: dutyVehicleLabel(vehicle),
  };
}

export async function getPopularDutyVehicles({ take = 8 } = {}) {
  try {
    const grouped = await db.dutyCalculation.groupBy({
      by: ["dutyVehicleId"],
      where: { dutyVehicleId: { not: null } },
      _count: { _all: true },
    });

    const trendingIds = grouped
      .sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0))
      .map((g) => g.dutyVehicleId)
      .filter(Boolean)
      .slice(0, take * 2);
    if (trendingIds.length > 0) {
      const trending = await db.dutyVehicle.findMany({
        where: { id: { in: trendingIds }, active: true },
      });
      const byId = new Map(trending.map((v) => [v.id, v]));
      const ordered = trendingIds.map((id) => byId.get(id)).filter(Boolean);
      if (ordered.length >= 4) return ordered.slice(0, take);
    }

    const featured = await db.dutyVehicle.findMany({
      where: {
        active: true,
        slug: { in: FEATURED_POPULAR_SLUGS },
      },
    });
    const featuredBySlug = new Map(featured.map((v) => [buildDutyVehicleSlug(v) || v.slug, v]));
    const curated = FEATURED_POPULAR_SLUGS.map((slug) => featuredBySlug.get(slug)).filter(Boolean);
    if (curated.length > 0) return curated.slice(0, take);

    return await db.dutyVehicle.findMany({
      where: { active: true },
      orderBy: [{ year: "desc" }, { make: "asc" }],
      take,
    });
  } catch (err) {
    if (!isDutyDbUnavailable(err)) {
      console.error("[duty] getPopularDutyVehicles:", err?.message || err);
    }
    return [];
  }
}

export async function computeDutyEstimate(input) {
  const { rates } = await getDutyRates();
  const year = Number(input.year);
  const engineCC = Number(input.engineCC) || 1500;
  const fuelType = input.fuelType || "PETROL";
  const crspKes = Math.max(0, Number(input.crspKes) || 0);
  const ageYears = getAgeYearsFromYear(year);
  const isElectric = fuelType === "ELECTRIC";

  const breakdown = calculateDutyBreakdown({
    cifKes: crspKes + FREIGHT_PROXY_KES,
    ageYears,
    engineCC,
    isElectric,
    rates,
  });

  return {
    label: input.label || dutyVehicleLabel(input),
    make: input.make,
    model: input.model,
    year,
    engineCC,
    fuelType,
    crspKes,
    ageYears,
    freightProxyKes: FREIGHT_PROXY_KES,
    breakdown: {
      customsValue: Math.round(breakdown.customsValue),
      importDuty: Math.round(breakdown.importDuty),
      importDutyRate: breakdown.importDutyRate,
      idf: Math.round(breakdown.idf),
      excise: Math.round(breakdown.excise),
      exciseRate: breakdown.exciseRate,
      exciseLabel: breakdown.exciseLabel,
      vat: Math.round(breakdown.vat),
      rdl: Math.round(breakdown.rdl),
      totalTaxes: Math.round(breakdown.totalTaxes),
      freightProxyKes: FREIGHT_PROXY_KES,
      cifKes: Math.round(crspKes + FREIGHT_PROXY_KES),
      vehicleReferenceKes: crspKes,
      totalToImport: Math.round(crspKes + FREIGHT_PROXY_KES + breakdown.totalTaxes),
      estimatedLanded: Math.round(crspKes + FREIGHT_PROXY_KES + breakdown.totalTaxes),
    },
    slug: input.slug || buildDutyVehicleSlug(input),
  };
}

export async function recordDutyCalculation(payload, meta = {}) {
  try {
    await db.dutyCalculation.create({
      data: {
        dutyVehicleId: payload.dutyVehicleId || null,
        searchQuery: meta.searchQuery || null,
        make: payload.make || null,
        model: payload.model || null,
        year: payload.year ?? null,
        engineCC: payload.engineCC ?? null,
        fuelType: payload.fuelType || null,
        crspKes: payload.crspKes ?? null,
        totalKes: payload.breakdown.totalTaxes,
        breakdown: payload.breakdown,
        sessionKey: meta.sessionKey || null,
      },
    });
  } catch (err) {
    console.warn("duty calculation log failed:", err?.message);
  }
}
