import modelWikiData from "../../data/seo/model-wiki.json";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";

const WIKI = modelWikiData;

/** Broad groups used to match curated guides to a listing's bodyType. */
export const WIKI_BODY_FAMILIES = {
  SUV: "suv",
  CROSSOVER: "suv",
  PICKUP: "suv",
  SEDAN: "sedan",
  COUPE: "sedan",
  HATCHBACK: "hatch",
  LIFTBACK: "hatch",
  WAGON: "wagon",
  MPV: "mpv",
  MINIVAN: "mpv",
  VAN: "van",
  BUS: "van",
  CONVERTIBLE: "coupe",
  ROADSTER: "coupe",
  TRUCK: "truck",
};

const SUV_PHRASES =
  /\b(suv|4x4|four[- ]wheel|off[- ]?road|seven[- ]seat|7[- ]seat|people[- ]carrier|ladder[- ]frame)\b/i;
const SEDAN_PHRASES = /\b(sedan|saloon|three[- ]box)\b/i;
const HATCH_PHRASES = /\b(hatch(?:back)?|liftback)\b/i;
const WAGON_PHRASES = /\b(wagon|estate|touring)\b/i;

export function wikiBodyFamily(bodyType) {
  if (!bodyType) return "other";
  const key = String(bodyType).toUpperCase().replace(/\s+/g, "_");
  return WIKI_BODY_FAMILIES[key] || "other";
}

function listingBodyLabel(car) {
  return (BODY_TYPE_LABELS[car.bodyType] || car.bodyType || "vehicle").toLowerCase();
}

function curatedEntryBodyFamilies(entry) {
  if (Array.isArray(entry?.bodyFamilies) && entry.bodyFamilies.length) {
    return entry.bodyFamilies.map((f) => String(f).toLowerCase());
  }
  return null;
}

function inferFamiliesFromCopy(text) {
  const blob = String(text || "").toLowerCase();
  const families = new Set();
  if (SUV_PHRASES.test(blob)) families.add("suv");
  if (SEDAN_PHRASES.test(blob)) families.add("sedan");
  if (HATCH_PHRASES.test(blob)) families.add("hatch");
  if (WAGON_PHRASES.test(blob)) families.add("wagon");
  return [...families];
}

/**
 * True when guide copy is appropriate for this listing's body type.
 */
export function guideMatchesListingBody(car, wiki, { curatedEntry = null } = {}) {
  if (!car?.bodyType || !wiki?.paragraphs?.length) return false;

  const listingFamily = wikiBodyFamily(car.bodyType);
  const declared = curatedEntryBodyFamilies(curatedEntry);
  if (declared?.length) {
    return declared.includes(listingFamily);
  }

  const blob = [wiki.headline, ...(wiki.paragraphs || []), ...(wiki.bullets || [])].join(" ");
  const implied = inferFamiliesFromCopy(blob);

  if (implied.length) {
    if (implied.includes(listingFamily)) return true;
    if (listingFamily === "other") return true;
    return false;
  }

  return true;
}

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

export function buildListingLeadParagraph(car) {
  const make = car.make;
  const model = car.model;
  const year = car.year;
  const fuel = (FUEL_LABELS[car.fuelType] || car.fuelType || "petrol").toLowerCase();
  const body = listingBodyLabel(car);
  const cc = car.engineCC ? `${car.engineCC}cc` : "this engine size";
  const variant = car.variant ? ` ${car.variant}` : "";

  return `This ${year} ${make} ${model}${variant} is listed as a ${body} with ${fuel} power (${cc}).`;
}

function inspectionParagraphForBody(car) {
  const family = wikiBodyFamily(car.bodyType);
  const body = listingBodyLabel(car);

  switch (family) {
    case "suv":
      return `For this ${body}, inspect 4WD components where fitted, underbody rust, rear differential noise, and cooling or hybrid systems. Ask for a Japan auction sheet or inspection report on imports.`;
    case "sedan":
      return `For this ${body}, check rear quarter panels, trunk floor rust, suspension bushings, and paint meter readings on repaired imports.`;
    case "hatch":
      return `For this ${body}, inspect hatch struts, rear hatch floor rust, and rear suspension wear from estate road use.`;
    case "wagon":
      return `For this ${body}, check tailgate alignment, load-area rust, and rear suspension on high-mileage units.`;
    case "mpv":
      return `For this ${body}, test all sliding doors and third-row latches, and confirm air-conditioning performance in every row.`;
    case "pickup":
    case "truck":
      return `For this ${body}, inspect load bed rust, chassis rails, and any ladder-frame corrosion before transfer.`;
    default:
      return `For this ${body}, inspect panel gaps, underbody rust, and cooling or hybrid systems where applicable. Ask for a recent inspection report if the unit was imported.`;
  }
}

/**
 * Listing-accurate buyer notes (always tied to this car's body, fuel, and year).
 */
export function buildListingTailoredWiki(car) {
  const make = car.make;
  const model = car.model;
  const body = listingBodyLabel(car);

  return {
    headline: `${car.year} ${make} ${car.model} (${BODY_TYPE_LABELS[car.bodyType] || car.bodyType})`,
    paragraphs: [
      buildListingLeadParagraph(car),
      `${inspectionParagraphForBody(car)} Kenyan buyers should confirm logbook year, mileage, and dealer service history before paying a deposit.`,
      `Use Welsh Motorhub to compare other ${make} ${model} ${body} listings, estimate import duty if needed, and contact the dealer directly from this page.`,
    ],
    bullets: [
      "Confirm logbook year matches the advertised registration year",
      "Test drive on your usual roads before you transfer funds",
      "Budget for insurance, transfer, and first service after purchase",
    ],
    source: "listing",
  };
}

/** @deprecated Use buildListingTailoredWiki */
export function buildGeneratedModelWiki(car) {
  return buildListingTailoredWiki(car);
}

function curatedWikiFromEntry(entry) {
  return {
    headline: entry.headline,
    paragraphs: [entry.summary, entry.specs, entry.kenyaNotes, entry.buyerTip].filter(Boolean),
    bullets: [],
    source: "curated",
  };
}

/**
 * Curated buyer guide for a make/model when it matches the listing body type.
 */
export function getModelWikiContent(car) {
  if (!car?.make || !car?.model) return null;

  const key = wikiKey(car.make, car.model);
  const entry = WIKI[key];
  if (entry) {
    const curated = curatedWikiFromEntry(entry);
    if (guideMatchesListingBody(car, curated, { curatedEntry: entry })) {
      return {
        ...curated,
        headline: `${car.year} ${car.make} ${car.model} (${BODY_TYPE_LABELS[car.bodyType] || car.bodyType})`,
        paragraphs: [buildListingLeadParagraph(car), ...curated.paragraphs],
      };
    }
  }

  return buildListingTailoredWiki(car);
}

/** Prefer DB guide when it matches this listing; otherwise curated JSON or tailored copy. */
export async function resolveModelWikiForCar(car) {
  if (!car?.make || !car?.model) return null;

  const tailored = buildListingTailoredWiki(car);

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
    if (fromDb?.paragraphs?.length && guideMatchesListingBody(car, fromDb)) {
      return {
        ...fromDb,
        headline: `${car.year} ${car.make} ${car.model} (${BODY_TYPE_LABELS[car.bodyType] || car.bodyType})`,
        paragraphs: [buildListingLeadParagraph(car), ...fromDb.paragraphs],
      };
    }
  } catch {
    /* table may not exist until migrate */
  }

  const fileWiki = getModelWikiContent(car);
  return fileWiki || tailored;
}

export function modelHubPath(make, model) {
  return `/cars/${slugifyCarSegment(make)}/${slugifyCarSegment(model)}`;
}
