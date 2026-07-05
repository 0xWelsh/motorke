import modelWikiData from "../../data/seo/model-wiki.json";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import {
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  DRIVETRAIN_LABELS,
} from "@/lib/constants";
import { formatMileage } from "@/lib/utils";
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

/**
 * Estimate fuel economy (km/L mixed) based on engine size and fuel type.
 */
function estimateFuelEconomy(cc, fuelType) {
  if (!cc) return null;
  if (fuelType === "HYBRID") return "18-25";
  if (fuelType === "DIESEL") {
    if (cc < 2000) return "15-19";
    if (cc < 3000) return "12-15";
    return "9-12";
  }
  if (fuelType === "PETROL") {
    if (cc < 1500) return "14-17";
    if (cc < 2000) return "11-14";
    if (cc < 2500) return "9-12";
    return "7-10";
  }
  return null;
}

/**
 * Listing-accurate buyer notes (always tied to this car's body, fuel, and year).
 */
export function buildListingTailoredWiki(car) {
  const make = car.make;
  const model = car.model;
  const fuel = (FUEL_LABELS[car.fuelType] || car.fuelType || "").toLowerCase();
  const trans = car.transmission
    ? (TRANSMISSION_LABELS[car.transmission] || car.transmission).toLowerCase()
    : null;
  const drive = car.drivetrain
    ? (DRIVETRAIN_LABELS[car.drivetrain] || car.drivetrain)
    : null;
  const mileageStr = car.mileage ? formatMileage(car.mileage) : null;
  const engineCC = car.engineCC ? parseInt(car.engineCC, 10) : null;

  // ── Paragraph 2: what to inspect (spec-specific) ──
  let inspect = [];
  if (car.fuelType === "DIESEL") {
    inspect.push("diesel items: DPF condition, turbo health, and whether the timing belt has been replaced");
  } else if (car.fuelType === "HYBRID") {
    inspect.push("hybrid battery health, inverter coolant, and the real-world fuel economy the seller is reporting");
  } else {
    inspect.push("timing chain or belt service interval, oil leaks, and cooling system condition");
  }
  if (car.transmission === "CVT") {
    inspect.push("CVT fluid change history — a dry CVT is costly to replace");
  } else if (car.transmission === "AUTOMATIC") {
    inspect.push("when the transmission fluid was last changed — rough shifts mean missed service");
  }
  if (engineCC && engineCC > 2500) inspect.push("cooling system health on this larger engine");

  let specP2 = `For a ${car.year} ${make} ${model}`;
  if (engineCC) specP2 += ` with a ${engineCC}cc`;
  specP2 += ` ${fuel} engine`;
  if (trans) specP2 += ` and ${trans}`;
  if (mileageStr) specP2 += ` at ${mileageStr}`;
  specP2 += `: check ${inspect.join("; ")}.`;

  // ── Paragraph 3: dealer questions + running costs ──
  let p3 = "Ask the dealer for the import documents, logbook, and service history. ";
  if (mileageStr) {
    p3 += `At ${mileageStr}, confirm major services (timing belt, transmission fluid, suspension) are done or due soon. `;
  } else {
    p3 += "Confirm the mileage and that the logbook year matches the advertised year. ";
  }

  const fuelEco = estimateFuelEconomy(engineCC, car.fuelType);
  if (fuelEco) {
    p3 += `Expect roughly ${fuelEco} km/L in mixed driving. `;
  }
  p3 += `Budget for annual insurance (3-5% of car value), NTSA transfer fees, and a pre-purchase inspection. Compare other ${make} ${model} listings on BIDGARI.`;

  // ── Bullets ──
  let testDriveTip = `Take a test drive on both smooth roads and rough patches to feel the `;
  if (drive) {
    testDriveTip += `${drive.toLowerCase()} response`;
  } else {
    testDriveTip += "drivetrain and suspension";
  }
  if (car.fuelType === "HYBRID") testDriveTip += ", and listen for the engine cutting in and out smoothly";
  testDriveTip += ".";

  return {
    headline: `${car.year} ${make} ${car.model} (${BODY_TYPE_LABELS[car.bodyType] || car.bodyType})`,
    paragraphs: [
      buildListingLeadParagraph(car),
      specP2,
      p3,
    ],
    bullets: [
      `Compare prices on BIDGARI — see what similar ${make} ${model} listings are actually selling for near you`,
      testDriveTip,
      "Get a pre-purchase inspection by an independent mechanic before you pay any deposit",
    ],
    source: "listing",
  };
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
