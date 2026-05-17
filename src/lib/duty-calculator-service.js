import { db } from "@/lib/db";
import { calculateDutyBreakdown, getAgeYearsFromYear } from "@/lib/duty";
import { getDutyRates } from "@/lib/duty-rates";
import { buildDutyVehicleSlug, dutyVehicleLabel } from "@/lib/duty-vehicle-slug";

const FREIGHT_PROXY_KES = 2750 * 135;

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

  return db.dutyVehicle.findMany({
    where,
    orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
    take: limit,
  });
}

export async function getDutyVehicleBySlug(slug) {
  if (!slug) return null;
  return db.dutyVehicle.findFirst({
    where: { slug: String(slug).trim().toLowerCase(), active: true },
  });
}

export async function getDutyVehicleById(id) {
  if (!id) return null;
  return db.dutyVehicle.findFirst({
    where: { id: String(id), active: true },
  });
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
      idf: Math.round(breakdown.idf),
      excise: Math.round(breakdown.excise),
      exciseRate: breakdown.exciseRate,
      exciseLabel: breakdown.exciseLabel,
      vat: Math.round(breakdown.vat),
      rdl: Math.round(breakdown.rdl),
      totalTaxes: Math.round(breakdown.total),
      estimatedLanded: Math.round(breakdown.landed),
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
