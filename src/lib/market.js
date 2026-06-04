import { db } from "./db";
import { unstable_cache } from "next/cache";
import { withDbRetry } from "./db-retry";

/**
 * Basic Price Analysis for a vehicle
 * @param {object} car - The car object containing make, model, year, price
 * @returns {Promise<object>} - { label: 'Great Price'|'Fair Price'|'Market Price', color: string, comparison: number }
 */
export async function analyzePrice(car) {
  if (!car?.make || !car?.model || !car?.price) return null;

  try {
    const similar = await withDbRetry(() => getSimilarPriceSample(car.make, car.model, car.year));

    if (similar.length < 3) {
      const broader = await withDbRetry(() => getBroaderPriceSample(car.make, car.model));
      if (broader.length < 3) return null;
      return calculateMetric(car.price, broader.map(s => s.price));
    }

    return calculateMetric(car.price, similar.map(s => s.price));
  } catch (error) {
    console.error("[market] Price analysis failed:", error);
    return null;
  }
}

// Cache model/year sample lookups to prevent repeated DB fanout under load.
const getSimilarPriceSample = unstable_cache(
  async (make, model, year) => {
    return db.car.findMany({
      where: {
        make,
        model,
        year: { gte: year - 1, lte: year + 1 },
        available: true,
      },
      select: { price: true },
      take: 20,
    });
  },
  ["market-similar-sample-v1"],
  { revalidate: 300, tags: ["market-analysis"] }
);

const getBroaderPriceSample = unstable_cache(
  async (make, model) => {
    return db.car.findMany({
      where: { make, model, available: true },
      select: { price: true },
      take: 50,
    });
  },
  ["market-broader-sample-v1"],
  { revalidate: 300, tags: ["market-analysis"] }
);

function calculateMetric(price, prices) {
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  if (price <= avg * 0.90) return { label: "Great Deal", color: "emerald", comparison: -10 };
  if (price <= avg * 1.05) return { label: "Fair Price", color: "blue", comparison: 0 };
  return { label: "Good Value", color: "slate", comparison: 5 };
}
