import { z } from "zod";
import { DEFAULT_DUTY_RATES, getDefaultDutyRates } from "./duty";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const dutyRatesSchema = z.object({
  version: z.string().optional(),
  source: z.string().optional(),
  effectiveFrom: z.string().optional(),
  fetchedAt: z.string().optional(),
  idfRate: z.coerce.number().min(0).max(1),
  vatRate: z.coerce.number().min(0).max(1),
  rdlAmount: z.coerce.number().min(0),
  depreciationBands: z
    .array(
      z.object({
        maxAge: z.coerce.number().int().min(1).nullable(),
        factor: z.coerce.number().gt(0).lte(1),
      })
    )
    .min(1),
  excise: z.object({
    electricRate: z.coerce.number().min(0).max(1),
    defaultRate: z.coerce.number().min(0).max(1).optional(),
    bands: z
      .array(
        z.object({
          minCC: z.coerce.number().int().min(0),
          maxCC: z.coerce.number().int().positive().nullable(),
          rate: z.coerce.number().min(0).max(1),
          label: z.string().optional(),
        })
      )
      .min(1),
  }),
});

let cache = {
  fetchedAt: 0,
  url: null,
  rates: null,
  meta: null,
};

function normalizeRates(rawRates) {
  const parsed = dutyRatesSchema.parse(rawRates);

  const depreciationBands = [...parsed.depreciationBands].sort((a, b) => {
    if (a.maxAge == null) return 1;
    if (b.maxAge == null) return -1;
    return a.maxAge - b.maxAge;
  });

  const exciseBands = [...parsed.excise.bands].sort((a, b) => a.minCC - b.minCC);

  return {
    idfRate: parsed.idfRate,
    vatRate: parsed.vatRate,
    rdlAmount: parsed.rdlAmount,
    depreciationBands,
    excise: {
      electricRate: parsed.excise.electricRate,
      defaultRate: parsed.excise.defaultRate ?? DEFAULT_DUTY_RATES.excise.defaultRate,
      bands: exciseBands,
    },
    metadata: {
      version: parsed.version || null,
      source: parsed.source || null,
      effectiveFrom: parsed.effectiveFrom || null,
      fetchedAt: parsed.fetchedAt || null,
    },
  };
}

export async function getDutyRates() {
  const url = process.env.DUTY_RATES_URL;

  if (!url) {
    return {
      rates: getDefaultDutyRates(),
      meta: {
        source: "local-default",
        effectiveFrom: null,
        lastUpdated: null,
        fallback: true,
        stale: false,
      },
    };
  }

  if (cache.url === url && cache.rates && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return {
      rates: clone(cache.rates),
      meta: { ...cache.meta, fromCache: true },
    };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch duty rates (${response.status})`);
    }

    const payload = await response.json();
    const normalized = normalizeRates(payload);

    const meta = {
      source: normalized.metadata.source || url,
      effectiveFrom: normalized.metadata.effectiveFrom || null,
      lastUpdated: normalized.metadata.fetchedAt || new Date().toISOString(),
      fallback: false,
      stale: false,
      fromCache: false,
    };

    cache = {
      fetchedAt: Date.now(),
      url,
      rates: normalized,
      meta,
    };

    return {
      rates: clone(normalized),
      meta,
    };
  } catch (error) {
    if (cache.url === url && cache.rates) {
      return {
        rates: clone(cache.rates),
        meta: {
          ...cache.meta,
          fallback: true,
          stale: true,
          error: error?.message || "Remote rates fetch failed",
          fromCache: true,
        },
      };
    }

    return {
      rates: getDefaultDutyRates(),
      meta: {
        source: "local-default",
        effectiveFrom: null,
        lastUpdated: null,
        fallback: true,
        stale: false,
        error: error?.message || "Remote rates fetch failed",
      },
    };
  }
}
