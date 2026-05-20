import modelWikiData from "../../data/seo/model-wiki.json";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";

const WIKI = modelWikiData;

function rowToWiki(row) {
  if (!row) return null;
  return {
    headline: row.headline,
    paragraphs: row.paragraphs || [],
    bullets: row.bullets || [],
    source: row.source || "template",
  };
}

function wikiKey(make, model) {
  return `${slugifyCarSegment(make)}|${slugifyCarSegment(model)}`;
}

/**
 * Curated buyer guide copy for a make/model (Kenya-localized).
 * @returns {{ headline: string; paragraphs: string[]; source: 'curated' | 'generated' } | null}
 */
export function getModelWikiContent(car) {
  if (!car?.make || !car?.model) return null;

  const key = wikiKey(car.make, car.model);
  const entry = WIKI[key];
  if (entry) {
    return {
      headline: entry.headline,
      paragraphs: [entry.summary, entry.specs, entry.kenyaNotes, entry.buyerTip].filter(Boolean),
      bullets: [],
      source: "curated",
    };
  }

  return buildGeneratedModelWiki(car);
}

/** Prefer DB guide (auto-generated on publish), then JSON file, then inline template. */
export async function resolveModelWikiForCar(car) {
  if (!car?.make || !car?.model) return null;

  try {
    const row = await db.modelSeoGuide.findUnique({
      where: {
        make_model: {
          make: String(car.make).trim(),
          model: String(car.model).trim(),
        },
      },
    });
    const fromDb = rowToWiki(row);
    if (fromDb?.paragraphs?.length) return fromDb;
  } catch {
    /* table may not exist until migrate */
  }

  return getModelWikiContent(car);
}

function buildGeneratedModelWiki(car) {
  const make = car.make;
  const model = car.model;
  const year = car.year;
  const fuel = FUEL_LABELS[car.fuelType] || car.fuelType || "petrol";
  const body = BODY_TYPE_LABELS[car.bodyType] || car.bodyType || "vehicle";
  const cc = car.engineCC ? `${car.engineCC}cc` : "this engine size";

  return {
    headline: `${make} ${model} — buyer notes for Kenya`,
    paragraphs: [
      `This ${year} ${make} ${model} is listed as a ${body.toLowerCase()} with ${fuel.toLowerCase()} power (${cc}). Kenyan buyers typically compare year, mileage, registration status, and dealer service history before paying a deposit.`,
      `For ${body.toLowerCase()} imports, inspect panel gaps, underbody rust, and cooling or hybrid systems where applicable. Ask for a recent inspection report or Japan auction sheet if the unit was imported.`,
      `Use Welsh Motorhub to compare other ${make} ${model} listings, run an import duty estimate if duty is not paid, and contact the dealer directly from this page.`,
    ],
    bullets: [
      "Confirm logbook year matches the advertised registration year",
      "Test drive on both tarmac and your regular estate roads",
      "Budget for transfer, insurance, and first service after purchase",
    ],
    source: "generated",
  };
}

export function modelHubPath(make, model) {
  return `/cars/${slugifyCarSegment(make)}/${slugifyCarSegment(model)}`;
}
