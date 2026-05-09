// Rule-based "smart summary" for compare page — no external AI; uses on-page specs + Kenya models.
import { formatPrice, formatCarPrice, formatMileage } from "@/lib/utils";

const PRESET_PHRASE = {
  all: "overall balance of price, running costs, comfort, and performance",
  city: "city driving (running costs, traffic-related fuel, ease of use)",
  family: "family use (space, comfort, and safety-related specs)",
  performance: "performance (power and drivetrain)",
  longtrip: "longer trips and total running cost",
};

/** One situational nudge per lens — not a “winner,” a lens for reading the sheet. */
const PRESET_LENS = {
  all: "Use lowest price plus annual TCO together: cheap to buy can still be costly to run.",
  city: "Short commutes: favour lower annual TCO and traffic-adjusted fuel costs over peak horsepower.",
  family: "Prioritise seats, airbags, and practicality; performance is secondary for school runs and luggage.",
  performance: "Here you’re weighing powertrain and drivetrain—still cross-check insurance and fuel before you decide.",
  longtrip: "Long drives: annual TCO, comfort, and road suitability matter more than city-traffic savings.",
};

/**
 * @param {object} p
 * @param {string} p.preset
 * @param {import("@prisma/client").Car[]} p.cars
 * @param {Map<string, object>} p.insightsMap
 * @param {object | null} p.overallCar — highest composite for current preset
 * @param {object | null} p.winnerByPrice
 * @param {object | null} p.winnerLowestTco
 * @param {object | null} p.winnerRoad
 * @param {object | null} p.winnerLowestMileage — car with lowest odometer among those with mileage set
 * @param {number | null} p.annualTcoSpread
 * @returns {{ headline: string, bullets: string[], disclaimer: string }}
 */
export function buildCompareNarrative({
  preset = "all",
  cars = [],
  insightsMap = new Map(),
  overallCar = null,
  winnerByPrice = null,
  winnerLowestTco = null,
  winnerRoad = null,
  winnerLowestMileage = null,
  annualTcoSpread = null,
}) {
  const disclaimer =
    "This summary is generated from the numbers on this page and our Kenya cost models. It is not a chatbot and does not replace a physical inspection, service history, or a bank quote.";

  if (cars.length === 0) {
    return { headline: "", bullets: [], disclaimer: "" };
  }

  if (cars.length === 1) {
    const c = cars[0];
    return {
      headline: "Add more to compare",
      bullets: [
        `Add up to two more cars to see tradeoffs side by side. Right now you only have ${c.year} ${c.make} ${c.model} in the matrix.`,
      ],
      disclaimer,
    };
  }

  const phrase = PRESET_PHRASE[preset] || PRESET_PHRASE.all;
  const bullets = [];

  const lensLine = PRESET_LENS[preset] || PRESET_LENS.all;
  if (lensLine) {
    bullets.push(lensLine);
  }

  if (overallCar) {
    const lensLabel = preset === "all" ? "Full sheet" : preset;
    bullets.push(
      `On this page’s “${lensLabel}” weighting, ${overallCar.year} ${overallCar.make} ${overallCar.model} scores highest for ${phrase}—treat that as a hint, not a final verdict.`
    );
  }

  if (winnerByPrice && cars.length > 1) {
    const price = formatCarPrice(winnerByPrice);
    bullets.push(`Lowest listed price in this set: ${winnerByPrice.make} ${winnerByPrice.model} (${price}).`);
  }

  if (winnerLowestTco) {
    const tco = insightsMap.get(winnerLowestTco.id)?.tco?.annualTotal;
    const extra =
      typeof tco === "number" ? ` Around ${formatPrice(tco)} per year estimated annual TCO in our model.` : "";
    bullets.push(`Lowest estimated annual TCO: ${winnerLowestTco.make} ${winnerLowestTco.model}.${extra}`);
  }

  if (winnerRoad) {
    const s = insightsMap.get(winnerRoad.id)?.roadSuitabilityScore;
    const extra = typeof s === "number" ? ` Road-readiness score ${s}/100.` : "";
    bullets.push(`Strongest on road suitability in this set: ${winnerRoad.make} ${winnerRoad.model}.${extra}`);
  }

  if (winnerLowestMileage && cars.length > 1 && winnerLowestMileage.mileage != null) {
    bullets.push(
      `Lowest listed mileage: ${winnerLowestMileage.make} ${winnerLowestMileage.model} (${formatMileage(winnerLowestMileage.mileage)})—always confirm with service history.`
    );
  }

  if (typeof annualTcoSpread === "number" && annualTcoSpread > 1000 && cars.length > 1) {
    bullets.push(
      `Gap between the highest and lowest annual TCO here is about ${formatPrice(annualTcoSpread)} per year—pair that with purchase price when you decide.`
    );
  }

  if (cars.length === 2) {
    bullets.push(`Tip: use “Differences” to hide identical rows and focus on what actually splits these two.`);
  }

  if (cars.length === 3) {
    bullets.push(
      `All three slots are used—if one is clearly not in the running, remove it to keep the table readable.`
    );
  }

  return {
    headline: "What the numbers suggest",
    bullets: bullets.slice(0, 8),
    disclaimer,
  };
}
