// scripts/seed-model-specs-nhtsa.mjs
// Fetches car model specs from NHTSA (model list) + CarQuery API (specs) + Wikimedia photos
// Run: node scripts/seed-model-specs-nhtsa.mjs
// Safe to run multiple times — upserts by (make, model, variant, yearStart)

import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const LOG_FILE = join(__dirname, "..", "logs", "seed-nhtsa.log");
const PROGRESS_FILE = join(__dirname, "..", "logs", "seed-nhtsa-progress.json");
const DELAY_MS = 600;

// Popular Kenyan-market makes
const TARGET_MAKES = [
  "Toyota", "Nissan", "Honda", "Mazda", "Subaru", "Suzuki", "Mitsubishi",
  "Isuzu", "BMW", "Mercedes-Benz", "Volkswagen", "Audi", "Land Rover",
  "Jaguar", "Volvo", "Ford", "Hyundai", "Kia", "Peugeot", "Renault",
  "Lexus", "Jeep", "Daihatsu", "Chrysler", "Dodge",
];

const BODY_MAP = {
  "SUV": "SUV", "SUV/Crossover": "SUV", "Crossover": "SUV",
  "Sedan": "SEDAN", "Saloon": "SEDAN", "Wagon": "WAGON",
  "Hatchback": "HATCHBACK", "Coupe": "COUPE", "Convertible": "CONVERTIBLE",
  "Pickup": "PICKUP", "Minivan": "MINIVAN", "Van": "MINIVAN",
  "Off-Road": "SUV", "Truck": "PICKUP",
};

const FUEL_MAP = {
  "Gasoline": "PETROL", "Gas": "PETROL", "Petrol": "PETROL",
  "Diesel": "DIESEL", "Hybrid": "HYBRID", "Electric": "ELECTRIC",
  "Flex Fuel": "PETROL", "Flex": "PETROL",
  "Natural Gas": "PETROL", "Propane": "PETROL",
};

const TRANS_MAP = {
  "Manual": "MANUAL", "Automatic": "AUTOMATIC", "CVT": "CVT",
  "Automated Manual": "AUTOMATIC",
};

const DRIVE_MAP = {
  "4WD": "FOURWD", "4-Wheel Drive": "FOURWD", "AWD": "AWD",
  "All-Wheel Drive": "AWD", "Front-Wheel Drive": "FWD",
  "FWD": "FWD", "Rear-Wheel Drive": "RWD", "RWD": "RWD",
};

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    writeFileSync(LOG_FILE, line + "\n", { flag: "a" });
  } catch {}
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "WelshMotorhub/1.0 (seed)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

// ── NHTSA — just for model names ──────────────────────

async function getNHTSAModels(make) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`;
  const data = await fetchJson(url);
  return [...new Set((data.Results || []).map((r) => r.Model_Name).filter(Boolean))];
}

function normalizeModelName(name) {
  return name
    .replace(/^\d+/g, "")        // leading numbers
    .replace(/[-/]/g, " ")       // hyphens/slashes to spaces
    .replace(/\s+/g, " ")
    .trim();
}

// ── CarQuery API — main data source ────────────────────

async function getCarQueryMakes() {
  const data = await fetchJson("https://www.carqueryapi.com/api/0.3/?cmd=getMakes");
  return data.Makes || [];
}

async function getCarQueryModels(makeId) {
  const data = await fetchJson(
    `https://www.carqueryapi.com/api/0.3/?cmd=getModels&make=${makeId}`
  );
  return data.Models || [];
}

async function getCarQueryTrims(makeId, model, year) {
  const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${makeId}&year=${year}&model=${encodeURIComponent(model)}`;
  const data = await fetchJson(url);
  return data.Trims || [];
}

// ── Wikimedia ──────────────────────────────────────────

async function getWikimediaImage(make, model) {
  const query = `${make} ${model}`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&srnamespace=6`;
  try {
    const data = await fetchJson(url);
    const pages = data.query?.search || [];
    if (!pages.length) return null;

    for (const page of pages) {
      const title = page.title;
      const imgUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&iiurlwidth=800`;
      const imgData = await fetchJson(imgUrl);
      const imgPages = imgData.query?.pages || {};
      const info = Object.values(imgPages)[0]?.imageinfo?.[0];
      if (info?.url) return info.url;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Merge specs ────────────────────────────────────────

function parseTrim(t) {
  const fuel = FUEL_MAP[t.model_fuel_type] || null;
  const hasHybrid = t.model_hybrid?.toLowerCase() === "yes" || t.model_engine_type?.toLowerCase() === "hybrid";
  const fuelType = hasHybrid ? "HYBRID" : fuel;

  const trans = TRANS_MAP[t.model_transmission_type] || null;
  const drive = DRIVE_MAP[t.model_drive] || null;
  const body = BODY_MAP[t.model_body] || null;

  const engineCC = t.model_engine_cc ? parseInt(t.model_engine_cc) : null;
  const cylinders = t.model_engine_cyl ? parseInt(t.model_engine_cyl) : null;
  const horsepower = t.model_engine_power_ps ? parseInt(t.model_engine_power_ps) : null;
  const torque = t.model_engine_torque_nm ? parseInt(t.model_engine_torque_nm) : null;
  const seats = t.model_seats ? parseInt(t.model_seats) : null;
  const doors = t.model_doors ? parseInt(t.model_doors) : null;
  const weight = t.model_weight_kg ? parseInt(t.model_weight_kg) : null;
  const tank = t.model_fuel_tank_l ? parseInt(t.model_fuel_tank_l) : null;

  return {
    bodyType: (body && !isNaN(body)) ? null : body,
    engineCC: (engineCC && engineCC > 0 && !isNaN(engineCC)) ? engineCC : null,
    cylinders: (cylinders && cylinders > 0) ? cylinders : null,
    horsepower: (horsepower && horsepower > 0) ? horsepower : null,
    torque: (torque && torque > 0) ? torque : null,
    fuelType,
    transmission: trans,
    drivetrain: drive,
    seats: (seats && seats > 0) ? seats : null,
    doors: (doors && doors > 0) ? doors : null,
    curbWeightKg: (weight && weight > 0) ? weight : null,
    fuelTankLiters: (tank && tank > 0) ? tank : null,
  };
}

// ── Main ───────────────────────────────────────────────

async function main() {
  log("=== Car Model Specs Seeder (NHTSA + CarQuery + Wikimedia) ===");
  log(`Targeting ${TARGET_MAKES.length} makes`);

  let progress = { completed: [], skipped: [], photos: {} };
  if (existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
      log(`Resuming: ${progress.completed.length} done, ${progress.skipped.length} skipped`);
    } catch {}
  }

  // Load CarQuery makes list
  let cqMakes = [];
  try {
    cqMakes = await getCarQueryMakes();
    log(`CarQuery: ${cqMakes.length} makes available`);
  } catch (e) {
    log(`ERROR: Could not fetch CarQuery makes list: ${e.message}`);
    process.exit(1);
  }

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const make of TARGET_MAKES) {
    log(`\n--- ${make} ---`);

    // NHTSA model list
    let nhtsaModels = [];
    try {
      nhtsaModels = await getNHTSAModels(make);
      log(`  NHTSA: ${nhtsaModels.length} models`);
    } catch (e) {
      log(`  NHTSA error: ${e.message}`);
      continue;
    }

    // CarQuery make id
    const cqMake = cqMakes.find(
      (m) => m.make_display?.toLowerCase() === make.toLowerCase()
      || m.make_name?.toLowerCase() === make.toLowerCase()
    );
    if (!cqMake) {
      log(`  No CarQuery make ID for ${make}, skipping`);
      continue;
    }
    const makeId = cqMake.make_id;
    log(`  CarQuery ID: ${makeId}`);

    // CarQuery models for this make
    let cqModels = [];
    try {
      cqModels = await getCarQueryModels(makeId);
      log(`  CarQuery: ${cqModels.length} models`);
    } catch (e) {
      log(`  CarQuery models error: ${e.message}`);
      continue;
    }
    await sleep(DELAY_MS);

    if (!cqModels.length) {
      log(`  No CarQuery models, skipping ${make}`);
      continue;
    }

    // Build lookup from NHTSA model names to CarQuery model names
    const cqModelMap = {};
    for (const cm of cqModels) {
      const norm = normalizeModelName(cm.model_name).toLowerCase();
      cqModelMap[norm] = cm.model_name;
    }

    // Match NHTSA model names to CarQuery model names
    for (const nhtsaModel of nhtsaModels) {
      const normNhtsa = normalizeModelName(nhtsaModel).toLowerCase();
      let cqName = cqModelMap[normNhtsa];

      // Fuzzy match if no exact match
      if (!cqName) {
        const match = Object.entries(cqModelMap).find(([k]) =>
          k.includes(normNhtsa) || normNhtsa.includes(k)
        );
        if (match) cqName = match[1];
      }

      if (!cqName) {
        continue;
      }

      const key = `${make}||${cqName}`;
      if (progress.completed.includes(key) || progress.skipped.includes(key)) continue;

      log(`  Processing: ${make} ${cqName}`);

      // Get CarQuery model detail to know available years
      const cqModelRow = cqModels.find((m) => m.model_name === cqName);
      if (!cqModelRow) continue;

      const yearsStr = cqModelRow.model_years || "";
      const years = yearsStr.split(",").map(Number).filter((y) => y >= 2000 && y <= 2025).sort((a, b) => a - b);

      if (years.length < 2) {
        log(`    Only ${years.length} years, skipping`);
        progress.skipped.push(key);
        continue;
      }

      log(`    Years: ${years[0]}–${years[years.length - 1]} (${years.length})`);

      // Get trims for middle year (best coverage)
      const repYear = years[Math.floor(years.length / 2)];
      let trims = [];
      try {
        trims = await getCarQueryTrims(makeId, cqName, repYear);
        await sleep(DELAY_MS);
      } catch (e) {
        log(`    CarQuery trims error: ${e.message}`);
        await sleep(DELAY_MS);
      }

      // Merge specs from all trims
      let merged = { bodyType: null, engineCC: null, cylinders: null, horsepower: null,
        torque: null, fuelType: null, transmission: null, drivetrain: null,
        seats: null, doors: null, curbWeightKg: null, fuelTankLiters: null };

      if (trims.length > 0) {
        const specsList = trims.map(parseTrim);
        // Take first non-null value for each field across all trims
        for (const s of specsList) {
          for (const [k, v] of Object.entries(s)) {
            if (v != null && merged[k] == null) merged[k] = v;
          }
        }
        log(`    ${trims.length} trims, specs: ${merged.engineCC ? `${Math.round(merged.engineCC / 10) / 100}L` : "—"} / ${merged.horsepower || "?"}hp`);
      } else {
        log(`    No trims found for ${repYear}`);
      }

      // Wikimedia photo
      let imageUrl = progress.photos[key];
      if (!imageUrl) {
        imageUrl = await getWikimediaImage(make, cqName);
        if (imageUrl) progress.photos[key] = imageUrl;
        await sleep(300);
      }

      // Upsert
      try {
        const payload = {
          make,
          model: cqName,
          variant: null,
          yearStart: years[0],
          yearEnd: years[years.length - 1],
          bodyType: merged.bodyType || null,
          vehicleType: "CAR",
          engineCC: merged.engineCC || null,
          cylinders: merged.cylinders || null,
          horsepower: merged.horsepower || null,
          torque: merged.torque || null,
          fuelType: merged.fuelType || null,
          transmission: merged.transmission || null,
          drivetrain: merged.drivetrain || null,
          steering: null,
          seats: merged.seats || null,
          doors: merged.doors || null,
          airbags: null,
          groundClearanceMm: null,
          turbo: false,
          sunroof: false,
          curbWeightKg: merged.curbWeightKg || null,
          fuelTankLiters: merged.fuelTankLiters || null,
          standardFeatures: [],
          imageUrl,
          source: "carquery+nhtsa+wikimedia",
          verified: false,
          published: false,
        };

        const result = await prisma.carModelSpec.upsert({
          where: {
            make_model_variant_yearStart: {
              make, model: cqName, variant: "", yearStart: years[0],
            },
          },
          create: payload,
          update: payload,
        });

        if (result) totalCreated++;
        progress.completed.push(key);
      } catch (e) {
        log(`    Upsert error: ${e.message}`);
        progress.skipped.push(key);
      }

      // Save progress every 5 models
      if (progress.completed.length % 5 === 0) {
        mkdirSync(dirname(PROGRESS_FILE), { recursive: true });
        writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        const count = await prisma.carModelSpec.count({ where: { published: true } });
        log(`  [checkpoint] ${progress.completed.length} done, ${count} published in DB`);
      }
    }
  }

  mkdirSync(dirname(PROGRESS_FILE), { recursive: true });
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  const total = await prisma.carModelSpec.count();
  const published = await prisma.carModelSpec.count({ where: { published: true } });
  log(`\n=== Done ===`);
  log(`Processed: ${totalCreated} new/updated`);
  log(`Total specs in DB: ${total}`);
  log(`Published: ${published}`);
  log(`\nNext steps:`);
  log(`1. Review unpublished specs at /admin/model-specs`);
  log(`2. Publish individual specs from the admin panel`);
  log(`3. Visit /models to see the encyclopedia`);
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
