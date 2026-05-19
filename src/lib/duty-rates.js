import { z } from "zod";
import { DEFAULT_DUTY_RATES, getDefaultDutyRates } from "./duty";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const dutyRatesSchema = z.object({
  version: z.string().optional(),
  source: z.string().optional(),
  effectiveFrom: z.string().optional(),
  fetchedAt: z.string().optional(),
  importDutyRate: z.coerce.number().min(0).max(1).optional(),
  idfRate: z.coerce.number().min(0).max(1),
  vatRate: z.coerce.number().min(0).max(1),
  rdlRate: z.coerce.number().min(0).max(1).optional(),
  rdlAmount: z.coerce.number().min(0).optional(),
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

function normalizeRates(rawRates) {
  const parsed = dutyRatesSchema.parse(rawRates);

  const depreciationBands = [...parsed.depreciationBands].sort((a, b) => {
    if (a.maxAge == null) return 1;
    if (b.maxAge == null) return -1;
    return a.maxAge - b.maxAge;
  });

  const exciseBands = [...parsed.excise.bands].sort((a, b) => a.minCC - b.minCC);

  return {
    importDutyRate: parsed.importDutyRate ?? DEFAULT_DUTY_RATES.importDutyRate,
    idfRate: parsed.idfRate,
    vatRate: parsed.vatRate,
    rdlRate: parsed.rdlRate ?? DEFAULT_DUTY_RATES.rdlRate,
    rdlAmount: parsed.rdlAmount ?? DEFAULT_DUTY_RATES.rdlAmount,
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

export const getDutyRates = unstable_cache(
  async () => {
    try {
      const customRatesStr = await db.setting.findUnique({
        where: { key: "advanced_duty_json" },
      });

      if (customRatesStr && customRatesStr.value && customRatesStr.value.trim() !== "") {
        const payload = JSON.parse(customRatesStr.value);
        const normalized = normalizeRates(payload);
        
        return {
          rates: clone(normalized),
          meta: {
            source: "admin-settings",
            effectiveFrom: null,
            lastUpdated: new Date().toISOString(),
            fallback: false,
            stale: false,
          },
        };
      }
    } catch (error) {
      console.warn("Failed to parse custom duty rates:", error.message);
    }

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
  },
  ["duty-rates-config"],
  { tags: ["duty-rates-config"], revalidate: 3600 }
);

