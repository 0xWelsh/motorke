import { db } from "@/lib/db";
import { generateModelWikiWithGrok } from "@/lib/ai/grok-model-wiki";
import { enqueueSeoJob } from "@/lib/seo-job-queue";
import { upsertComparisonPage, discoverComparisonPairs } from "@/lib/seo-comparison-generator";
import { getModelWikiContent } from "@/lib/seo-model-wiki";
import { requestGoogleUrlIndexing } from "@/lib/google-indexing";
import { carListingPath } from "@/lib/car-listing-url";
import { revalidateHubPathsForCar } from "@/lib/revalidate-inventory";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

const MIN_DESCRIPTION_CHARS = 120;

function normalizeMakeModel(make, model) {
  return {
    make: String(make || "").trim(),
    model: String(model || "").trim(),
  };
}

/**
 * Upsert template or curated wiki into DB (instant, no AI).
 */
export async function ensureModelSeoGuide(make, model, carContext = null) {
  const { make: m, model: mod } = normalizeMakeModel(make, model);
  if (!m || !mod) return { skipped: true };

  const existing = await db.modelSeoGuide.findUnique({
    where: { make_model: { make: m, model: mod } },
  });
  if (existing) return { ok: true, id: existing.id, source: existing.source, created: false };

  const ctx = carContext || {
    make: m,
    model: mod,
    year: 2020,
    fuelType: "PETROL",
    bodyType: "SEDAN",
  };
  const wiki = getModelWikiContent(ctx);
  if (!wiki?.paragraphs?.length) return { skipped: true, reason: "no_template" };

  const row = await db.modelSeoGuide.create({
    data: {
      make: m,
      model: mod,
      headline: wiki.headline,
      paragraphs: wiki.paragraphs,
      bullets: wiki.bullets || [],
      source: wiki.source === "curated" ? "curated" : "template",
    },
  });

  return { ok: true, id: row.id, source: row.source, created: true };
}

async function maybeGenerateAiModelGuide(make, model, carContext) {
  const { make: m, model: mod } = normalizeMakeModel(make, model);
  const existing = await db.modelSeoGuide.findUnique({
    where: { make_model: { make: m, model: mod } },
  });
  if (existing?.source === "ai" || existing?.source === "curated") return existing;

  const ai = await generateModelWikiWithGrok(carContext || { make: m, model: mod });
  if (!ai) return existing || null;

  return db.modelSeoGuide.upsert({
    where: { make_model: { make: m, model: mod } },
    create: {
      make: m,
      model: mod,
      headline: ai.headline,
      paragraphs: ai.paragraphs,
      bullets: ai.bullets,
      source: "ai",
    },
    update: {
      headline: ai.headline,
      paragraphs: ai.paragraphs,
      bullets: ai.bullets,
      source: "ai",
    },
  });
}

async function maybeEnhanceCarDescription(carId) {
  if (!process.env.XAI_API_KEY) return { skipped: true };

  const car = await db.car.findUnique({
    where: { id: carId },
    select: {
      id: true,
      description: true,
      make: true,
      model: true,
      year: true,
      fuelType: true,
      engineCC: true,
      bodyType: true,
      mileage: true,
      price: true,
    },
  });
  if (!car) return { skipped: true };
  if ((car.description || "").trim().length >= MIN_DESCRIPTION_CHARS) {
    return { skipped: true, reason: "description_ok" };
  }

  const { callGrokJson } = await import("@/lib/ai/grokVehicle");
  const parsed = await callGrokJson(
    [
      {
        role: "system",
        content:
          'Write one paragraph (80-140 words) for a used car listing in Kenya. Return JSON: {"description": "..."}. Plain text, no markdown.',
      },
      {
        role: "user",
        content: JSON.stringify({
          year: car.year,
          make: car.make,
          model: car.model,
          fuelType: car.fuelType,
          engineCC: car.engineCC,
          bodyType: car.bodyType,
          mileage: car.mileage,
        }),
      },
    ],
    3500
  );

  const text = String(parsed?.description || "").trim();
  if (text.length < 60) return { skipped: true };

  await db.car.update({
    where: { id: carId },
    data: { description: text.slice(0, 1200) },
  });

  return { ok: true, chars: text.length };
}

async function syncComparisonForMake(make) {
  const pairs = await discoverComparisonPairs({ maxPairs: 6, minListings: 2 });
  const related = pairs.filter((p) => p.makeA === make || p.makeB === make).slice(0, 2);
  const synced = [];
  for (const pair of related) {
    const page = await upsertComparisonPage(pair);
    synced.push(page.slug);
  }
  return { synced: synced.length };
}

/**
 * Full async SEO pass (cron/job). Safe to retry.
 */
export async function runListingSeoJob(carId) {
  const car = await db.car.findUnique({
    where: { id: carId },
    select: {
      id: true,
      available: true,
      make: true,
      model: true,
      year: true,
      fuelType: true,
      engineCC: true,
      bodyType: true,
      price: true,
      publicSlug: true,
    },
  });

  if (!car || !car.available) {
    return { ok: false, reason: "car_unavailable" };
  }

  await ensureModelSeoGuide(car.make, car.model, car);
  const guide = await maybeGenerateAiModelGuide(car.make, car.model, car);
  const description = await maybeEnhanceCarDescription(car.id);
  const comparisons = await syncComparisonForMake(car.make);
  revalidateHubPathsForCar(car);

  return {
    ok: true,
    carId: car.id,
    guide: guide?.source || null,
    description,
    comparisons,
    hubs: [car.make, car.model].map(slugifyCarSegment),
  };
}

/**
 * Fire-and-forget when a listing goes live. Pages are SSR — hubs revalidate; job handles AI/heavy work.
 */
export function scheduleListingSeo(car) {
  if (!car?.id || car.available === false) return;

  const path = carListingPath(car);
  queueMicrotask(() => {
    requestGoogleUrlIndexing(path).catch(() => {});
  });

  queueMicrotask(() => {
    (async () => {
      try {
        await ensureModelSeoGuide(car.make, car.model, car);
        revalidateHubPathsForCar({
          make: car.make,
          model: car.model,
          bodyType: car.bodyType,
          price: car.price,
        });
        await enqueueSeoJob("LISTING_SEO", { carId: car.id });
      } catch (err) {
        console.warn("[listing-seo] schedule failed:", err?.message || err);
      }
    })();
  });
}
