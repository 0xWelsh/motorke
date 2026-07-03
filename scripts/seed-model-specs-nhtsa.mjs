// scripts/seed-model-specs-nhtsa.mjs
// Seeds CarModelSpec from NHTSA API + Wikimedia Commons
// NHTSA is the official US govt vehicle database — free, no auth, reliable
// Run: node scripts/seed-model-specs-nhtsa.mjs  (resumable)
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

const TARGET_MAKES = [
  "Toyota", "Nissan", "Honda", "Mazda", "Subaru", "Suzuki", "Mitsubishi",
  "Isuzu", "BMW", "Mercedes-Benz", "Volkswagen", "Audi", "Land Rover",
  "Jaguar", "Volvo", "Ford", "Hyundai", "Kia", "Peugeot", "Renault",
  "Lexus", "Jeep", "Daihatsu", "Chrysler", "Dodge",
];

// Map NHTSA body class values to your enum
const BODY_MAP = {
  "SUV": "SUV", "Sport Utility Vehicle": "SUV", "Crossover": "SUV",
  "Minivan": "MINIVAN", "Van": "MINIVAN", "Bus": "MINIVAN",
  "Sedan": "SEDAN", "Saloon": "SEDAN",
  "Hatchback": "HATCHBACK", "Coupe": "COUPE", "Convertible": "CONVERTIBLE",
  "Wagon": "WAGON", "Station Wagon": "WAGON",
  "Pickup": "PICKUP", "Cab": "PICKUP",
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
    headers: { "User-Agent": "WelshMotorhub/1.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── NHTSA API ──────────────────────────────────────────

async function getModels(make) {
  const data = await fetchJson(
    `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`
  );
  return [...new Set((data.Results || []).map((r) => r.Model_Name).filter(Boolean))];
}

// Get ALL models for a make + year (no model filter — returns everything for that year)
async function getModelsForYear(make, year) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
  const data = await fetchJson(url);
  return (data.Results || []).map((r) => r.Model_Name).filter(Boolean);
}

// Get detailed variable values for a specific make/model/year
async function getSpecsForYearModel(make, model, year) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}/modelyear/${year}?format=json`;
  try {
    const data = await fetchJson(url);
    const rows = data.Results || [];
    if (!rows.length) return null;

    // Collect unique values across all trims
    const vals = {};
    for (const row of rows) {
      for (const [key, val] of Object.entries(row)) {
        if (val && val !== "" && val !== "N/A" && val !== "Not Available" && val !== "Not Required") {
          if (!vals[key]) vals[key] = new Set();
          vals[key].add(String(val));
        }
      }
    }
    const get = (k) => {
      const s = vals[k];
      return s ? [...s][0] : null;
    };

    const bodyRaw = get("BodyClass") || get("BodyType") || "";
    let bodyType = null;
    for (const [k, v] of Object.entries(BODY_MAP)) {
      if (bodyRaw.toLowerCase().includes(k.toLowerCase())) { bodyType = v; break; }
    }

    const fuelRaw = (get("FuelTypePrimary") || get("FuelType") || "").toLowerCase();
    let fuelType = null;
    if (fuelRaw.includes("diesel")) fuelType = "DIESEL";
    else if (fuelRaw.includes("hybrid")) fuelType = "HYBRID";
    else if (fuelRaw.includes("electric")) fuelType = "ELECTRIC";
    else if (fuelRaw.includes("gas") || fuelRaw.includes("petrol") || fuelRaw.includes("flex")) fuelType = "PETROL";

    const transRaw = (get("TransmissionStyle") || get("TransmissionType") || "").toLowerCase();
    let transmission = null;
    if (transRaw.includes("cvt")) transmission = "CVT";
    else if (transRaw.includes("auto")) transmission = "AUTOMATIC";
    else if (transRaw.includes("manual")) transmission = "MANUAL";

    const driveRaw = (get("DriveType") || "").toLowerCase();
    let drivetrain = null;
    if (driveRaw.includes("4-wheel") || driveRaw.includes("4wd") || driveRaw.includes("part-time")) drivetrain = "FOURWD";
    else if (driveRaw.includes("all-wheel") || driveRaw.includes("awd")) drivetrain = "AWD";
    else if (driveRaw.includes("front")) drivetrain = "FWD";
    else if (driveRaw.includes("rear")) drivetrain = "RWD";

    const cylinders = get("EngineCylinders") ? parseInt(get("EngineCylinders")) : null;
    let engineCC = null;
    const disp = get("DisplacementCC") || get("EngineDisplacementCC") || get("Displacement");
    if (disp) {
      const n = parseFloat(String(disp).replace(/[^0-9.]/g, ""));
      if (!isNaN(n)) engineCC = n < 100 ? Math.round(n * 16.387) : Math.round(n); // ci to cc
    }
    const horsepower = get("EngineHP") || get("EngineHorsepower");
    const hp = horsepower ? parseInt(horsepower) : null;

    return {
      bodyType,
      fuelType,
      transmission,
      drivetrain,
      engineCC: (engineCC && engineCC > 0) ? engineCC : null,
      cylinders: (cylinders && cylinders > 0) ? cylinders : null,
      horsepower: (hp && hp > 0) ? hp : null,
    };
  } catch {
    return null;
  }
}

// ── Wikimedia ──────────────────────────────────────────

async function getWikimediaImage(make, model) {
  try {
    const data = await fetchJson(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(make + " " + model)}&srlimit=3&format=json&srnamespace=6`
    );
    const pages = data.query?.search || [];
    if (!pages.length) return null;
    for (const page of pages) {
      const imgData = await fetchJson(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(page.title)}&prop=imageinfo&iiprop=url&format=json&iiurlwidth=800`
      );
      const info = Object.values(imgData.query?.pages || {})[0]?.imageinfo?.[0];
      if (info?.url) return info.url;
      await sleep(200);
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main ───────────────────────────────────────────────

async function main() {
  log("=== NHTSA Model Specs Seeder ===");
  log(`Targeting ${TARGET_MAKES.length} makes`);

  let progress = { completed: [], skipped: [] };
  if (existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
      log(`Resuming: ${progress.completed.length} done, ${progress.skipped.length} skipped`);
    } catch {}
  }

  let totalCreated = 0;

  for (const make of TARGET_MAKES) {
    log(`\n--- ${make} ---`);

    // 1. Get all models from NHTSA
    let models;
    try {
      models = await getModels(make);
      log(`  Models: ${models.length}`);
    } catch (e) { log(`  Skip: ${e.message}`); continue; }

    // 2. For each model, get years by checking multiple sample years
    const modelYears = {};
    const sampleYears = [2005, 2010, 2015, 2018, 2020, 2022, 2024];
    for (const year of sampleYears) {
      try {
        const yearModels = await getModelsForYear(make, year);
        for (const m of yearModels) {
          if (!modelYears[m]) modelYears[m] = [];
          modelYears[m].push(year);
        }
      } catch {}
      await sleep(200);
    }

    // 3. Process models with 2+ detected years
    for (const [model, years] of Object.entries(modelYears)) {
      const key = `${make}||${model}`;
      if (progress.completed.includes(key)) continue;
      if (years.length < 2) { progress.skipped.push(key); continue; }

      log(`  ${model}: ${years[0]}–${years[years.length - 1]} (${years.length} sample yrs)`);

      // Get specs from a representative year
      const repYear = years[Math.floor(years.length / 2)];
      const specs = await getSpecsForYearModel(make, model, repYear);
      if (specs) log(`    ${specs.engineCC ? `${Math.round(specs.engineCC / 10) / 100}L` : ""} ${specs.horsepower ? `${specs.horsepower}hp` : ""} ${specs.fuelType || ""}`.trim() || "    basic data");

      // Wikimedia photo
      let imageUrl;
      try { imageUrl = await getWikimediaImage(make, model); } catch {}
      if (imageUrl) log(`    photo found`);
      else log(`    no photo`);

      try {
        await prisma.carModelSpec.upsert({
          where: { make_model_variant_yearStart: { make, model, variant: "", yearStart: years[0] } },
          create: {
            make, model, variant: null,
            yearStart: years[0], yearEnd: years[years.length - 1],
            bodyType: specs?.bodyType || null, vehicleType: "CAR",
            engineCC: specs?.engineCC || null,
            cylinders: specs?.cylinders || null,
            horsepower: specs?.horsepower || null,
            fuelType: specs?.fuelType || null,
            transmission: specs?.transmission || null,
            drivetrain: specs?.drivetrain || null,
            steering: null, seats: null, doors: null, airbags: null,
            groundClearanceMm: null, turbo: false, sunroof: false,
            curbWeightKg: null, fuelTankLiters: null, standardFeatures: [],
            imageUrl, source: "nhtsa", verified: false, published: false,
          },
          update: {
            yearEnd: years[years.length - 1],
            bodyType: specs?.bodyType || null,
            engineCC: specs?.engineCC || null,
            cylinders: specs?.cylinders || null,
            horsepower: specs?.horsepower || null,
            fuelType: specs?.fuelType || null,
            transmission: specs?.transmission || null,
            drivetrain: specs?.drivetrain || null,
            imageUrl: imageUrl || undefined,
          },
        });
        totalCreated++;
        progress.completed.push(key);
      } catch (e) {
        log(`    upsert error: ${e.message}`);
        progress.skipped.push(key);
      }

      if (progress.completed.length % 5 === 0) {
        mkdirSync(dirname(PROGRESS_FILE), { recursive: true });
        writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      }
    }
  }

  mkdirSync(dirname(PROGRESS_FILE), { recursive: true });
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  const total = await prisma.carModelSpec.count();
  log(`\n=== Done ===`);
  log(`Seeded: ${totalCreated}`);
  log(`Total in DB: ${total}`);
  log(`\nReview at /admin/model-specs then publish`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
