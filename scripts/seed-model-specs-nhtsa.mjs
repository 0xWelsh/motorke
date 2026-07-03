// scripts/seed-model-specs-nhtsa.mjs
// Fetches car model specs from NHTSA API + Wikimedia Commons photos
// Run: node scripts/seed-model-specs-nhtsa.mjs
// Safe to run multiple times — upserts by (make, model, variant, yearStart)

import { PrismaClient } from "@prisma/client";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const LOG_FILE = join(__dirname, "..", "logs", "seed-nhtsa.log");
const PROGRESS_FILE = join(__dirname, "..", "logs", "seed-nhtsa-progress.json");
const BATCH_SIZE = 5; // concurrent API calls
const CARQUERY_DELAY_MS = 600; // between CarQuery calls (~1000/day limit)

// Popular Kenyan-market makes with their NHTSA names
const TARGET_MAKES = [
  "Toyota", "Nissan", "Honda", "Mazda", "Subaru", "Suzuki", "Mitsubishi",
  "Isuzu", "BMW", "Mercedes-Benz", "Volkswagen", "Audi", "Land Rover",
  "Jaguar", "Volvo", "Ford", "Hyundai", "Kia", "Peugeot", "Renault",
  "Lexus", "Jeep", "Daihatsu", "Chrysler", "Dodge", "Chevrolet",
];

const BODY_MAP = {
  "SUV": "SUV", "Crossover": "SUV", "Sport Utility Vehicle": "SUV",
  "Sedan": "SEDAN", "Saloon": "SEDAN",
  "Hatchback": "HATCHBACK", "Coupe": "COUPE", "Convertible": "CONVERTIBLE",
  "Wagon": "WAGON", "Station Wagon": "WAGON", "Estate": "WAGON",
  "Pickup": "PICKUP", "Pick-up": "PICKUP", "Cab & Chassis": "PICKUP",
  "Van": "MINIVAN", "Minivan": "MINIVAN", "Minibus": "MINIVAN",
  "Bus": "MINIVAN", "Cargo Van": "MINIVAN", "Cargo Minivan": "MINIVAN",
  "Truck": "PICKUP",
};

const FUEL_MAP = {
  "Gasoline": "PETROL", "Petrol": "PETROL", "Flex-Fuel": "PETROL",
  "Diesel": "DIESEL", "Hybrid": "HYBRID", "Electric": "ELECTRIC",
  "Natural Gas": "PETROL", "Propane": "PETROL", "Hydrogen": "PETROL",
  "Gas": "PETROL",
};

const TRANS_MAP = {
  "Manual": "MANUAL", "Automatic": "AUTOMATIC", "CVT": "CVT",
  "Automated Manual": "AUTOMATIC", "Semi-Automatic": "AUTOMATIC",
  "Dual Clutch": "AUTOMATIC", "Continuously Variable": "CVT",
};

const DRIVE_MAP = {
  "4-Wheel Drive": "FOURWD", "4x4": "FOURWD", "All-Wheel Drive": "AWD",
  "4WD": "FOURWD", "AWD": "AWD", "Front-Wheel Drive": "FWD",
  "FWD": "FWD", "Rear-Wheel Drive": "RWD", "RWD": "RWD",
  "Part-time 4-Wheel Drive": "FOURWD", "Full-time 4-Wheel Drive": "FOURWD",
};

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    if (!existsSync(dirname(LOG_FILE))) mkdirSync(dirname(LOG_FILE), { recursive: true });
    const fs = createWriteStream(LOG_FILE, { flags: "a" });
    fs.write(line + "\n");
    fs.end();
  } catch {}
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "WelshMotorhub/1.0 (seed-script)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

// ── NHTSA API ──────────────────────────────────────────

async function getNHTSAModels(make) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`;
  const data = await fetchJson(url);
  return (data.Results || []).map((r) => r.Model_Name).filter(Boolean);
}

async function getNHTSAYears(make, model) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`;
  const data = await fetchJson(url);
  const years = [...new Set((data.Results || []).map((r) => r.ModelYear).filter(Boolean).map(Number))];
  return years.sort((a, b) => a - b);
}

async function getNHTSADetails(make, model, year) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}/modelyear/${year}?format=json`;
  const data = await fetchJson(url);
  const rows = data.Results || [];
  if (!rows.length) return null;

  // Collect all variable values across trims
  const vars = {};
  for (const row of rows) {
    for (const [key, val] of Object.entries(row)) {
      if (val && val !== "" && val !== "N/A") {
        if (!vars[key]) vars[key] = new Set();
        vars[key].add(val);
      }
    }
  }

  const getVal = (key) => {
    const s = vars[key];
    if (!s || s.size === 0) return null;
    return [...s].join(", ");
  };

  const bodyRaw = getVal("BodyClass") || getVal("BodyType") || getVal("VehicleType");
  const bodyParts = (bodyRaw || "").split(/[/,]/).map((s) => s.trim());
  let bodyType = null;
  for (const p of bodyParts) {
    const mapped = BODY_MAP[p];
    if (mapped) { bodyType = mapped; break; }
  }
  if (!bodyType) {
    for (const [k, v] of Object.entries(BODY_MAP)) {
      if (bodyRaw?.toLowerCase().includes(k.toLowerCase())) { bodyType = v; break; }
    }
  }

  const fuelRaw = getVal("FuelTypePrimary") || getVal("FuelType");
  let fuelType = FUEL_MAP[fuelRaw] || null;
  if (!fuelType && fuelRaw) {
    for (const [k, v] of Object.entries(FUEL_MAP)) {
      if (fuelRaw.toLowerCase().includes(k.toLowerCase())) { fuelType = v; break; }
    }
  }

  const transRaw = getVal("TransmissionStyle") || getVal("TransmissionType");
  let transmission = TRANS_MAP[transRaw] || null;
  if (!transmission && transRaw) {
    if (transRaw.toLowerCase().includes("cvt")) transmission = "CVT";
    else if (transRaw.toLowerCase().includes("auto")) transmission = "AUTOMATIC";
    else if (transRaw.toLowerCase().includes("manual")) transmission = "MANUAL";
  }

  const driveRaw = getVal("DriveType");
  let drivetrain = DRIVE_MAP[driveRaw] || null;
  if (!drivetrain && driveRaw) {
    for (const [k, v] of Object.entries(DRIVE_MAP)) {
      if (driveRaw.toLowerCase().includes(k.toLowerCase())) { drivetrain = v; break; }
    }
  }

  const engCyl = getVal("EngineCylinders");
  const engDisp = getVal("DisplacementCC") || getVal("EngineDisplacementCC") || getVal("Displacement");
  const engHP = getVal("EngineHP") || getVal("EngineHorsepower");
  const engConfig = getVal("EngineConfiguration");
  const seats = getVal("Seats");
  const doors = getVal("Doors");

  let cylinders = engCyl ? parseInt(engCyl) : null;
  if (cylinders && isNaN(cylinders)) cylinders = null;
  let engineCC = engDisp ? parseFloat(engDisp.replace(/[^0-9.]/g, "")) : null;
  if (engineCC && engineCC < 100) engineCC = Math.round(engineCC * 16.387); // cubic inches to cc
  if (engineCC && isNaN(engineCC)) engineCC = null;
  let horsepower = engHP ? parseInt(engHP) : null;
  if (horsepower && isNaN(horsepower)) horsepower = null;

  const isTurbo = getVal("Turbo") || getVal("ForcedInduction");
  const turbo = isTurbo?.toLowerCase() === "yes" || isTurbo?.toLowerCase() === "true" || false;

  // Better hybrid detection
  const hasHybrid = fuelType === "HYBRID" || getVal("Hybrid")?.toLowerCase() === "yes";

  return {
    bodyType,
    vehicleType: "CAR",
    engineCC,
    cylinders,
    horsepower,
    fuelType: hasHybrid ? "HYBRID" : fuelType,
    transmission,
    drivetrain,
    turbo,
  };
}

// ── CarQuery API (secondary enrichment) ────────────────

async function getCarQueryMakeId(make) {
  const data = await fetchJson("https://www.carqueryapi.com/api/0.3/?cmd=getMakes");
  const makes = data.Makes || [];
  const match = makes.find(
    (m) => m.make_display?.toLowerCase() === make.toLowerCase()
  );
  return match?.make_id || null;
}

async function getCarQueryModels(makeId) {
  const data = await fetchJson(
    `https://www.carqueryapi.com/api/0.3/?cmd=getModels&make=${makeId}`
  );
  return (data.Models || []).map((m) => m.model_name).filter(Boolean);
}

async function getCarQueryTrims(makeId, model, year) {
  const data = await fetchJson(
    `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${makeId}&year=${year}&model=${encodeURIComponent(model)}`
  );
  return data.Trims || [];
}

// ── Wikimedia Commons ─────────────────────────────────

async function getWikimediaImage(make, model) {
  const query = `${make} ${model} automobile`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&srnamespace=6`;
  try {
    const data = await fetchJson(url);
    const pages = data.query?.search || [];
    if (!pages.length) return null;

    // Get the first image's URL
    const title = pages[0].title;
    const imgUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&iiurlwidth=800`;
    const imgData = await fetchJson(imgUrl);
    const imgPages = imgData.query?.pages || {};
    const page = Object.values(imgPages)[0];
    const info = page?.imageinfo?.[0];
    return info?.url || info?.thumburl || null;
  } catch (e) {
    log(`  Wikimedia fetch failed for ${make} ${model}: ${e.message}`);
    return null;
  }
}

// ── Main ───────────────────────────────────────────────

async function main() {
  log("=== NHTSA + Wikimedia Model Specs Seeder ===");
  log(`Targeting ${TARGET_MAKES.length} makes`);

  // Load progress
  let progress = { completed: [], skipped: [], photos: {} };
  if (existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(require("fs").readFileSync(PROGRESS_FILE, "utf-8"));
      log(`Resuming from saved progress (${progress.completed.length} done)`);
    } catch { progress = { completed: [], skipped: [], photos: {} }; }
  }

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const make of TARGET_MAKES) {
    log(`\n--- Processing make: ${make} ---`);

    // 1. Get models from NHTSA
    let models = [];
    try {
      models = await getNHTSAModels(make);
      log(`  NHTSA: ${models.length} models found`);
    } catch (e) {
      log(`  NHTSA error for ${make}: ${e.message}`);
      continue;
    }

    // 2. For each model, get years and details
    for (const model of models) {
      const key = `${make}||${model}`;
      if (progress.completed.includes(key)) {
        continue;
      }

      let years = [];
      try {
        years = await getNHTSAYears(make, model);
      } catch (e) {
        log(`  Years error ${make} ${model}: ${e.message}`);
        progress.skipped.push(key);
        continue;
      }

      if (years.length < 2) continue; // skip obscure models

      log(`  ${make} ${model}: ${years.length} years (${years[0]}–${years[years.length-1]})`);

      // Get details for a representative year (middle year)
      const repYear = years[Math.floor(years.length / 2)];
      let details = {};
      try {
        const d = await getNHTSADetails(make, model, repYear);
        if (d) details = d;
      } catch (e) {
        log(`    Details error: ${e.message}`);
      }

      // Try CarQuery for richer specs (with delay)
      let cqSpecs = {};
      try {
        const makeId = await getCarQueryMakeId(make);
        if (makeId) {
          const trims = await getCarQueryTrims(makeId, model, repYear);
          if (trims && trims.length > 0) {
            const t = trims[0];
            cqSpecs = {
              engineCC: t.model_engine_cc ? parseInt(t.model_engine_cc) : null,
              cylinders: t.model_engine_cyl ? parseInt(t.model_engine_cyl) : null,
              horsepower: t.model_engine_power_ps ? parseInt(t.model_engine_power_ps) : null,
              torque: t.model_engine_torque_nm ? parseInt(t.model_engine_torque_nm) : null,
              fuelType: FUEL_MAP[t.model_fuel_type] || details.fuelType,
              transmission: TRANS_MAP[t.model_transmission_type] || details.transmission,
              drivetrain: DRIVE_MAP[t.model_drive] || details.drivetrain,
              bodyType: BODY_MAP[t.model_body] || details.bodyType,
              seats: t.model_seats ? parseInt(t.model_seats) : null,
              doors: t.model_doors ? parseInt(t.model_doors) : null,
              curbWeightKg: t.model_weight_kg ? parseInt(t.model_weight_kg) : null,
              fuelTankLiters: t.model_fuel_tank_l ? parseInt(t.model_fuel_tank_l) : null,
            };
            // Clean nulls
            for (const [k, v] of Object.entries(cqSpecs)) {
              if (v !== null && (isNaN(v) || v <= 0)) cqSpecs[k] = null;
            }
            log(`    CarQuery: trim "${t.model_trim || "—"}" specs found`);
          }
          await sleep(CARQUERY_DELAY_MS);
        }
      } catch (e) {
        log(`    CarQuery error: ${e.message}`);
      }

      // Wikimedia photo
      let imageUrl = progress.photos[key];
      if (!imageUrl) {
        imageUrl = await getWikimediaImage(make, model);
        if (imageUrl) progress.photos[key] = imageUrl;
        await sleep(300);
      }

      // Merge specs (CarQuery overrides NHTSA where available)
      const merged = { ...details, ...cqSpecs };

      // Upsert a single entry spanning all years
      try {
        const payload = {
          make,
          model,
          variant: null,
          yearStart: years[0],
          yearEnd: years[years.length - 1],
          bodyType: merged.bodyType || null,
          vehicleType: merged.vehicleType || "CAR",
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
          turbo: merged.turbo === true,
          sunroof: false,
          curbWeightKg: merged.curbWeightKg || null,
          fuelTankLiters: merged.fuelTankLiters || null,
          standardFeatures: [],
          imageUrl,
          source: "nhtsa+carquery",
          verified: false,
          published: false,
        };

        const result = await prisma.carModelSpec.upsert({
          where: {
            make_model_variant_yearStart: {
              make, model, variant: "", yearStart: years[0],
            },
          },
          create: payload,
          update: payload,
        });

        if (result) {
          const created = result.createdAt?.getTime() === result.updatedAt?.getTime();
          if (created) totalCreated++;
          else totalUpdated++;
        }

        progress.completed.push(key);
      } catch (e) {
        log(`    Upsert error: ${e.message}`);
        progress.skipped.push(key);
      }

      // Save progress every 10 models
      if (progress.completed.length % 10 === 0) {
        try {
          if (!existsSync(dirname(PROGRESS_FILE))) mkdirSync(dirname(PROGRESS_FILE), { recursive: true });
          require("fs").writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        } catch {}
      }
    }
  }

  // Save final progress
  try {
    if (!existsSync(dirname(PROGRESS_FILE))) mkdirSync(dirname(PROGRESS_FILE), { recursive: true });
    require("fs").writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch {}

  const total = await prisma.carModelSpec.count();
  log(`\n=== Done ===`);
  log(`Created: ${totalCreated}, Updated: ${totalUpdated}`);
  log(`Total specs in DB: ${total}`);
  log(`All unpublished by default — review at /admin/model-specs`);
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
