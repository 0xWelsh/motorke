// scripts/seed-kenyan-specs.mjs
// Curated specs for popular Kenyan import models + Wikipedia thumbnail enrichment
// Run: node scripts/seed-kenyan-specs.mjs  (safe to re-run — upserts by make+model)
import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const LOG_FILE = join(__dirname, "..", "logs", "seed-kenyan-specs.log");

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

// ── Curated specs for popular Kenyan imports ──────────────────────
// Fields: make, model, vehicleType, bodyType, engineCC, cylinders,
//         horsepower, torque, fuelType, transmission, drivetrain,
//         steering, seats, doors, turbo
const CURATED = [
  // ── TOYOTA ──────────────────────────────────
  { make: "Toyota", model: "Harrier", bodyType: "SUV", engineCC: 1987, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Vitz", bodyType: "HATCHBACK", engineCC: 996, cylinders: 3, horsepower: 69, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Axio", bodyType: "SEDAN", engineCC: 1496, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Toyota", model: "Fielder", bodyType: "WAGON", engineCC: 1496, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Land Cruiser Prado", bodyType: "SUV", engineCC: 2694, cylinders: 4, horsepower: 163, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Hilux", bodyType: "PICKUP", engineCC: 2393, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5 },
  { make: "Toyota", model: "Premio", bodyType: "SEDAN", engineCC: 1798, cylinders: 4, horsepower: 144, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Toyota", model: "Corolla", bodyType: "SEDAN", engineCC: 1798, cylinders: 4, horsepower: 132, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Toyota", model: "RAV4", bodyType: "SUV", engineCC: 1987, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Voxy", bodyType: "MPV", engineCC: 1987, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Noah", bodyType: "MPV", engineCC: 1987, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Aqua", bodyType: "HATCHBACK", engineCC: 1497, cylinders: 4, horsepower: 74, fuelType: "HYBRID", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Passo", bodyType: "HATCHBACK", engineCC: 996, cylinders: 3, horsepower: 69, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Sienta", bodyType: "MPV", engineCC: 1496, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Wish", bodyType: "MPV", engineCC: 1998, cylinders: 4, horsepower: 155, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Allion", bodyType: "SEDAN", engineCC: 1798, cylinders: 4, horsepower: 144, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Toyota", model: "Probox", bodyType: "WAGON", engineCC: 1496, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Camry", bodyType: "SEDAN", engineCC: 2494, cylinders: 4, horsepower: 178, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Toyota", model: "Prius", bodyType: "HATCHBACK", engineCC: 1798, cylinders: 4, horsepower: 98, fuelType: "HYBRID", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Hiace", bodyType: "VAN", engineCC: 2494, cylinders: 4, horsepower: 95, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "RWD", doors: 5, seats: 10 },
  { make: "Toyota", model: "Highlander", bodyType: "SUV", engineCC: 3456, cylinders: 6, horsepower: 270, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Rumion", bodyType: "MPV", engineCC: 1496, cylinders: 4, horsepower: 103, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Land Cruiser", bodyType: "SUV", engineCC: 4461, cylinders: 8, horsepower: 282, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 8 },
  { make: "Toyota", model: "4Runner", bodyType: "SUV", engineCC: 3956, cylinders: 6, horsepower: 270, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Tacoma", bodyType: "PICKUP", engineCC: 2694, cylinders: 4, horsepower: 159, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5 },
  { make: "Toyota", model: "Tundra", bodyType: "PICKUP", engineCC: 5663, cylinders: 8, horsepower: 381, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 6 },
  { make: "Toyota", model: "Sequoia", bodyType: "SUV", engineCC: 5663, cylinders: 8, horsepower: 381, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 8 },
  { make: "Toyota", model: "Sienna", bodyType: "MPV", engineCC: 3456, cylinders: 6, horsepower: 296, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 8 },
  { make: "Toyota", model: "Avalon", bodyType: "SEDAN", engineCC: 3456, cylinders: 6, horsepower: 268, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Toyota", model: "Yaris", bodyType: "HATCHBACK", engineCC: 1496, cylinders: 4, horsepower: 106, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Toyota", model: "Celica", bodyType: "COUPE", engineCC: 1798, cylinders: 4, horsepower: 140, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 3, seats: 4 },
  { make: "Toyota", model: "Fortuner", bodyType: "SUV", engineCC: 2393, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7 },
  { make: "Toyota", model: "Starlet", bodyType: "HATCHBACK", engineCC: 1296, cylinders: 4, horsepower: 75, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5 },

  // ── NISSAN ──────────────────────────────────
  { make: "Nissan", model: "Note", bodyType: "HATCHBACK", engineCC: 1198, cylinders: 3, horsepower: 79, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Nissan", model: "X-Trail", bodyType: "SUV", engineCC: 1997, cylinders: 4, horsepower: 144, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Nissan", model: "Juke", bodyType: "SUV", engineCC: 1498, cylinders: 4, horsepower: 108, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Nissan", model: "Wingroad", bodyType: "WAGON", engineCC: 1498, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Nissan", model: "March", bodyType: "HATCHBACK", engineCC: 1198, cylinders: 3, horsepower: 79, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Nissan", model: "Serena", bodyType: "MPV", engineCC: 1997, cylinders: 4, horsepower: 147, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 8 },
  { make: "Nissan", model: "Pathfinder", bodyType: "SUV", engineCC: 3498, cylinders: 6, horsepower: 260, fuelType: "PETROL", transmission: "CVT", drivetrain: "FOURWD", doors: 5, seats: 7 },
  { make: "Nissan", model: "Patrol", bodyType: "SUV", engineCC: 3954, cylinders: 6, horsepower: 275, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 8 },
  { make: "Nissan", model: "Murano", bodyType: "SUV", engineCC: 3498, cylinders: 6, horsepower: 260, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Nissan", model: "Tiida", bodyType: "HATCHBACK", engineCC: 1498, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Nissan", model: "AD Van", bodyType: "VAN", engineCC: 1498, cylinders: 4, horsepower: 105, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 2 },
  { make: "Nissan", model: "Qashqai", bodyType: "SUV", engineCC: 1197, cylinders: 3, horsepower: 115, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Nissan", model: "Navara", bodyType: "PICKUP", engineCC: 2488, cylinders: 4, horsepower: 140, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5 },
  { make: "Nissan", model: "Sunny", bodyType: "SEDAN", engineCC: 1498, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Nissan", model: "Bluebird", bodyType: "SEDAN", engineCC: 1998, cylinders: 4, horsepower: 145, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Nissan", model: "Skyline", bodyType: "SEDAN", engineCC: 2496, cylinders: 6, horsepower: 215, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5 },
  { make: "Nissan", model: "GT-R", bodyType: "COUPE", engineCC: 3799, cylinders: 6, horsepower: 565, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 2, seats: 4, turbo: true },

  // ── HONDA ───────────────────────────────────
  { make: "Honda", model: "Fit", bodyType: "HATCHBACK", engineCC: 1318, cylinders: 4, horsepower: 99, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Honda", model: "Vezel", bodyType: "SUV", engineCC: 1496, cylinders: 4, horsepower: 131, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Honda", model: "CR-V", bodyType: "SUV", engineCC: 1997, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Honda", model: "Civic", bodyType: "SEDAN", engineCC: 1799, cylinders: 4, horsepower: 140, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Honda", model: "Accord", bodyType: "SEDAN", engineCC: 2356, cylinders: 4, horsepower: 185, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Honda", model: "Freed", bodyType: "MPV", engineCC: 1496, cylinders: 4, horsepower: 118, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Honda", model: "Stepwgn", bodyType: "MPV", engineCC: 1997, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 8 },
  { make: "Honda", model: "Stream", bodyType: "MPV", engineCC: 1799, cylinders: 4, horsepower: 140, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Honda", model: "Odyssey", bodyType: "MPV", engineCC: 2356, cylinders: 4, horsepower: 175, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Honda", model: "HR-V", bodyType: "SUV", engineCC: 1496, cylinders: 4, horsepower: 121, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Honda", model: "City", bodyType: "SEDAN", engineCC: 1497, cylinders: 4, horsepower: 118, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Honda", model: "Pilot", bodyType: "SUV", engineCC: 3471, cylinders: 6, horsepower: 280, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 8 },

  // ── MAZDA ───────────────────────────────────
  { make: "Mazda", model: "Demio", bodyType: "HATCHBACK", engineCC: 1298, cylinders: 4, horsepower: 83, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Mazda", model: "CX-5", bodyType: "SUV", engineCC: 1998, cylinders: 4, horsepower: 155, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5 },
  { make: "Mazda", model: "Atenza", bodyType: "SEDAN", engineCC: 1998, cylinders: 4, horsepower: 155, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Mazda", model: "Axela", bodyType: "SEDAN", engineCC: 1496, cylinders: 4, horsepower: 111, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Mazda", model: "BT-50", bodyType: "PICKUP", engineCC: 2198, cylinders: 4, horsepower: 148, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5 },
  { make: "Mazda", model: "CX-3", bodyType: "SUV", engineCC: 1496, cylinders: 4, horsepower: 111, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Mazda", model: "CX-9", bodyType: "SUV", engineCC: 3726, cylinders: 6, horsepower: 273, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7 },
  { make: "Mazda", model: "Bongo", bodyType: "VAN", engineCC: 1998, cylinders: 4, horsepower: 85, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "RWD", doors: 5, seats: 6 },
  { make: "Mazda", model: "Mazda2", bodyType: "HATCHBACK", engineCC: 1496, cylinders: 4, horsepower: 111, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Mazda", model: "Mazda3", bodyType: "SEDAN", engineCC: 1998, cylinders: 4, horsepower: 155, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Mazda", model: "Mazda6", bodyType: "SEDAN", engineCC: 1998, cylinders: 4, horsepower: 155, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Mazda", model: "Verisa", bodyType: "HATCHBACK", engineCC: 1498, cylinders: 4, horsepower: 113, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },

  // ── SUBARU ──────────────────────────────────
  { make: "Subaru", model: "Forester", bodyType: "SUV", engineCC: 1995, cylinders: 4, horsepower: 148, fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", doors: 5, seats: 5 },
  { make: "Subaru", model: "Outback", bodyType: "WAGON", engineCC: 2498, cylinders: 4, horsepower: 175, fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", doors: 5, seats: 5 },
  { make: "Subaru", model: "Legacy", bodyType: "SEDAN", engineCC: 2498, cylinders: 4, horsepower: 175, fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", doors: 4, seats: 5 },
  { make: "Subaru", model: "Impreza", bodyType: "SEDAN", engineCC: 1995, cylinders: 4, horsepower: 148, fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", doors: 4, seats: 5 },
  { make: "Subaru", model: "XV", bodyType: "SUV", engineCC: 1995, cylinders: 4, horsepower: 148, fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", doors: 5, seats: 5 },
  { make: "Subaru", model: "Crosstrek", bodyType: "SUV", engineCC: 1995, cylinders: 4, horsepower: 148, fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", doors: 5, seats: 5 },
  { make: "Subaru", model: "Tribeca", bodyType: "SUV", engineCC: 3630, cylinders: 6, horsepower: 256, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7 },
  { make: "Subaru", model: "WRX", bodyType: "SEDAN", engineCC: 2457, cylinders: 4, horsepower: 268, fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", doors: 4, seats: 5, turbo: true },

  // ── SUZUKI ──────────────────────────────────
  { make: "Suzuki", model: "Swift", bodyType: "HATCHBACK", engineCC: 1242, cylinders: 4, horsepower: 89, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Suzuki", model: "Vitara", bodyType: "SUV", engineCC: 1586, cylinders: 4, horsepower: 117, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Suzuki", model: "Ertiga", bodyType: "MPV", engineCC: 1373, cylinders: 4, horsepower: 94, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Suzuki", model: "Jimny", bodyType: "SUV", engineCC: 1328, cylinders: 4, horsepower: 85, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FOURWD", doors: 3, seats: 4 },
  { make: "Suzuki", model: "Alto", bodyType: "HATCHBACK", engineCC: 796, cylinders: 3, horsepower: 50, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 4 },
  { make: "Suzuki", model: "Wagon R", bodyType: "HATCHBACK", engineCC: 996, cylinders: 3, horsepower: 68, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Suzuki", model: "Solio", bodyType: "MPV", engineCC: 1242, cylinders: 4, horsepower: 89, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Suzuki", model: "Splash", bodyType: "HATCHBACK", engineCC: 1242, cylinders: 4, horsepower: 86, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Suzuki", model: "Escudo", bodyType: "SUV", engineCC: 1995, cylinders: 4, horsepower: 140, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5 },
  { make: "Suzuki", model: "SX4", bodyType: "SUV", engineCC: 1586, cylinders: 4, horsepower: 112, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Suzuki", model: "Celerio", bodyType: "HATCHBACK", engineCC: 998, cylinders: 3, horsepower: 68, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Suzuki", model: "Grand Vitara", bodyType: "SUV", engineCC: 1995, cylinders: 4, horsepower: 140, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5 },

  // ── MITSUBISHI ──────────────────────────────
  { make: "Mitsubishi", model: "Pajero", bodyType: "SUV", engineCC: 3200, cylinders: 4, horsepower: 197, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7 },
  { make: "Mitsubishi", model: "Outlander", bodyType: "SUV", engineCC: 1998, cylinders: 4, horsepower: 145, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Mitsubishi", model: "Lancer", bodyType: "SEDAN", engineCC: 1499, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Mitsubishi", model: "Montero Sport", bodyType: "SUV", engineCC: 2477, cylinders: 4, horsepower: 136, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7 },
  { make: "Mitsubishi", model: "Colt", bodyType: "HATCHBACK", engineCC: 1332, cylinders: 4, horsepower: 94, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Mitsubishi", model: "ASX", bodyType: "SUV", engineCC: 1590, cylinders: 4, horsepower: 117, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Mitsubishi", model: "Delica", bodyType: "MPV", engineCC: 2477, cylinders: 4, horsepower: 136, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 8 },
  { make: "Mitsubishi", model: "Eclipse Cross", bodyType: "SUV", engineCC: 1499, cylinders: 4, horsepower: 148, fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Mitsubishi", model: "Mirage", bodyType: "HATCHBACK", engineCC: 1193, cylinders: 3, horsepower: 78, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Mitsubishi", model: "Pajero Mini", bodyType: "SUV", engineCC: 659, cylinders: 4, horsepower: 64, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 3, seats: 4 },

  // ── BMW ─────────────────────────────────────
  { make: "BMW", model: "X5", bodyType: "SUV", engineCC: 2993, cylinders: 6, horsepower: 255, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "BMW", model: "X3", bodyType: "SUV", engineCC: 1995, cylinders: 4, horsepower: 184, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "BMW", model: "3 Series", bodyType: "SEDAN", engineCC: 1995, cylinders: 4, horsepower: 184, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "BMW", model: "5 Series", bodyType: "SEDAN", engineCC: 1995, cylinders: 4, horsepower: 184, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "BMW", model: "X1", bodyType: "SUV", engineCC: 1995, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "BMW", model: "X6", bodyType: "SUV", engineCC: 2993, cylinders: 6, horsepower: 255, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "BMW", model: "1 Series", bodyType: "HATCHBACK", engineCC: 1995, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 5, seats: 5, turbo: true },
  { make: "BMW", model: "7 Series", bodyType: "SEDAN", engineCC: 2998, cylinders: 6, horsepower: 265, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "BMW", model: "Z4", bodyType: "ROADSTER", engineCC: 1995, cylinders: 4, horsepower: 184, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 2, seats: 2, turbo: true },
  { make: "BMW", model: "i3", bodyType: "HATCHBACK", engineCC: 647, cylinders: 2, horsepower: 170, fuelType: "ELECTRIC", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 5, seats: 4 },

  // ── MERCEDES-BENZ ───────────────────────────
  { make: "Mercedes-Benz", model: "C-Class", bodyType: "SEDAN", engineCC: 1796, cylinders: 4, horsepower: 156, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "E-Class", bodyType: "SEDAN", engineCC: 2148, cylinders: 4, horsepower: 170, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "GLC", bodyType: "SUV", engineCC: 2148, cylinders: 4, horsepower: 170, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "GLE", bodyType: "SUV", engineCC: 2148, cylinders: 4, horsepower: 204, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "S-Class", bodyType: "SEDAN", engineCC: 2999, cylinders: 6, horsepower: 367, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "GLA", bodyType: "SUV", engineCC: 1595, cylinders: 4, horsepower: 156, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "GLB", bodyType: "SUV", engineCC: 1991, cylinders: 4, horsepower: 163, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7, turbo: true },
  { make: "Mercedes-Benz", model: "A-Class", bodyType: "HATCHBACK", engineCC: 1595, cylinders: 4, horsepower: 156, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "CLS", bodyType: "SEDAN", engineCC: 2999, cylinders: 6, horsepower: 367, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "G-Class", bodyType: "SUV", engineCC: 2925, cylinders: 6, horsepower: 286, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5, turbo: true },
  { make: "Mercedes-Benz", model: "V-Class", bodyType: "MPV", engineCC: 2148, cylinders: 4, horsepower: 163, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 5, seats: 8, turbo: true },
  { make: "Mercedes-Benz", model: "SLK", bodyType: "ROADSTER", engineCC: 1796, cylinders: 4, horsepower: 184, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 2, seats: 2, turbo: true },

  // ── VOLKSWAGEN ──────────────────────────────
  { make: "Volkswagen", model: "Golf", bodyType: "HATCHBACK", engineCC: 1395, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Volkswagen", model: "Passat", bodyType: "SEDAN", engineCC: 1968, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Volkswagen", model: "Tiguan", bodyType: "SUV", engineCC: 1984, cylinders: 4, horsepower: 184, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Volkswagen", model: "Polo", bodyType: "HATCHBACK", engineCC: 1197, cylinders: 4, horsepower: 90, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Volkswagen", model: "Touran", bodyType: "MPV", engineCC: 1968, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 7, turbo: true },
  { make: "Volkswagen", model: "Touareg", bodyType: "SUV", engineCC: 2967, cylinders: 6, horsepower: 204, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Volkswagen", model: "Jetta", bodyType: "SEDAN", engineCC: 1395, cylinders: 4, horsepower: 147, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Volkswagen", model: "Beetle", bodyType: "COUPE", engineCC: 1984, cylinders: 4, horsepower: 210, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 3, seats: 4, turbo: true },
  { make: "Volkswagen", model: "Caddy", bodyType: "VAN", engineCC: 1968, cylinders: 4, horsepower: 102, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Volkswagen", model: "Amarok", bodyType: "PICKUP", engineCC: 2967, cylinders: 6, horsepower: 224, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5, turbo: true },

  // ── AUDI ────────────────────────────────────
  { make: "Audi", model: "A4", bodyType: "SEDAN", engineCC: 1968, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Audi", model: "A6", bodyType: "SEDAN", engineCC: 1968, cylinders: 4, horsepower: 190, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 4, seats: 5, turbo: true },
  { make: "Audi", model: "Q5", bodyType: "SUV", engineCC: 1968, cylinders: 4, horsepower: 190, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Audi", model: "Q7", bodyType: "SUV", engineCC: 2967, cylinders: 6, horsepower: 210, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7, turbo: true },
  { make: "Audi", model: "A3", bodyType: "SEDAN", engineCC: 1968, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Audi", model: "A8", bodyType: "SEDAN", engineCC: 2967, cylinders: 6, horsepower: 218, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 4, seats: 5, turbo: true },
  { make: "Audi", model: "Q3", bodyType: "SUV", engineCC: 1968, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Audi", model: "TT", bodyType: "COUPE", engineCC: 1984, cylinders: 4, horsepower: 230, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 2, seats: 4, turbo: true },

  // ── LAND ROVER ──────────────────────────────
  { make: "Land Rover", model: "Range Rover", bodyType: "SUV", engineCC: 2993, cylinders: 6, horsepower: 255, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5, turbo: true },
  { make: "Land Rover", model: "Range Rover Sport", bodyType: "SUV", engineCC: 2993, cylinders: 6, horsepower: 255, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5, turbo: true },
  { make: "Land Rover", model: "Discovery", bodyType: "SUV", engineCC: 2993, cylinders: 6, horsepower: 245, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7, turbo: true },
  { make: "Land Rover", model: "Freelander", bodyType: "SUV", engineCC: 2179, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5, turbo: true },
  { make: "Land Rover", model: "Evoque", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Land Rover", model: "Discovery Sport", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7, turbo: true },
  { make: "Land Rover", model: "Range Rover Velar", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 180, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },

  // ── VOLVO ───────────────────────────────────
  { make: "Volvo", model: "XC60", bodyType: "SUV", engineCC: 1969, cylinders: 4, horsepower: 190, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Volvo", model: "XC90", bodyType: "SUV", engineCC: 1969, cylinders: 4, horsepower: 235, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7, turbo: true },
  { make: "Volvo", model: "S60", bodyType: "SEDAN", engineCC: 1969, cylinders: 4, horsepower: 190, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Volvo", model: "S80", bodyType: "SEDAN", engineCC: 2400, cylinders: 5, horsepower: 215, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Volvo", model: "V40", bodyType: "HATCHBACK", engineCC: 1969, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Volvo", model: "V60", bodyType: "WAGON", engineCC: 1969, cylinders: 4, horsepower: 190, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },

  // ── FORD ────────────────────────────────────
  { make: "Ford", model: "Ranger", bodyType: "PICKUP", engineCC: 2198, cylinders: 4, horsepower: 148, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5, turbo: true },
  { make: "Ford", model: "Everest", bodyType: "SUV", engineCC: 2198, cylinders: 4, horsepower: 148, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7, turbo: true },
  { make: "Ford", model: "Focus", bodyType: "HATCHBACK", engineCC: 1999, cylinders: 4, horsepower: 160, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Ford", model: "Escape", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 168, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Ford", model: "Explorer", bodyType: "SUV", engineCC: 3497, cylinders: 6, horsepower: 290, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7 },
  { make: "Ford", model: "F-150", bodyType: "PICKUP", engineCC: 3497, cylinders: 6, horsepower: 290, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5, turbo: true },
  { make: "Ford", model: "Mustang", bodyType: "COUPE", engineCC: 4951, cylinders: 8, horsepower: 460, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 2, seats: 4 },
  { make: "Ford", model: "Edge", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 180, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Ford", model: "Fusion", bodyType: "SEDAN", engineCC: 1999, cylinders: 4, horsepower: 175, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },

  // ── HYUNDAI ─────────────────────────────────
  { make: "Hyundai", model: "Tucson", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 155, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Hyundai", model: "Santa Fe", bodyType: "SUV", engineCC: 2199, cylinders: 4, horsepower: 197, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7, turbo: true },
  { make: "Hyundai", model: "Elantra", bodyType: "SEDAN", engineCC: 1999, cylinders: 4, horsepower: 147, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Hyundai", model: "i10", bodyType: "HATCHBACK", engineCC: 1197, cylinders: 4, horsepower: 87, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Hyundai", model: "i20", bodyType: "HATCHBACK", engineCC: 1396, cylinders: 4, horsepower: 100, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Hyundai", model: "H-1", bodyType: "VAN", engineCC: 2497, cylinders: 4, horsepower: 170, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 5, seats: 12, turbo: true },
  { make: "Hyundai", model: "Kona", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 147, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Hyundai", model: "Sonata", bodyType: "SEDAN", engineCC: 1999, cylinders: 4, horsepower: 180, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Hyundai", model: "Creta", bodyType: "SUV", engineCC: 1497, cylinders: 4, horsepower: 115, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Hyundai", model: "Grandeur", bodyType: "SEDAN", engineCC: 3342, cylinders: 6, horsepower: 248, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },

  // ── KIA ─────────────────────────────────────
  { make: "Kia", model: "Sportage", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 155, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Kia", model: "Sorento", bodyType: "SUV", engineCC: 2199, cylinders: 4, horsepower: 197, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7, turbo: true },
  { make: "Kia", model: "Picanto", bodyType: "HATCHBACK", engineCC: 1248, cylinders: 4, horsepower: 83, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Kia", model: "Rio", bodyType: "SEDAN", engineCC: 1396, cylinders: 4, horsepower: 108, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Kia", model: "Cerato", bodyType: "SEDAN", engineCC: 1999, cylinders: 4, horsepower: 156, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Kia", model: "Optima", bodyType: "SEDAN", engineCC: 1999, cylinders: 4, horsepower: 163, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Kia", model: "Soul", bodyType: "SUV", engineCC: 1591, cylinders: 4, horsepower: 130, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Kia", model: "Carnival", bodyType: "MPV", engineCC: 2199, cylinders: 4, horsepower: 197, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 8, turbo: true },

  // ── ISUZU ───────────────────────────────────
  { make: "Isuzu", model: "D-Max", bodyType: "PICKUP", engineCC: 2540, cylinders: 4, horsepower: 130, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5, turbo: true },
  { make: "Isuzu", model: "MU-X", bodyType: "SUV", engineCC: 2540, cylinders: 4, horsepower: 130, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7, turbo: true },
  { make: "Isuzu", model: "TFR", bodyType: "PICKUP", engineCC: 2771, cylinders: 4, horsepower: 85, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "FOURWD", doors: 2, seats: 2 },
  { make: "Isuzu", model: "Bighorn", bodyType: "SUV", engineCC: 3165, cylinders: 4, horsepower: 140, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5 },
  { make: "Isuzu", model: "Gemini", bodyType: "SEDAN", engineCC: 1586, cylinders: 4, horsepower: 100, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 4, seats: 5 },

  // ── LEXUS ───────────────────────────────────
  { make: "Lexus", model: "RX", bodyType: "SUV", engineCC: 3456, cylinders: 6, horsepower: 270, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5 },
  { make: "Lexus", model: "NX", bodyType: "SUV", engineCC: 1998, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Lexus", model: "IS", bodyType: "SEDAN", engineCC: 2499, cylinders: 6, horsepower: 204, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5 },
  { make: "Lexus", model: "ES", bodyType: "SEDAN", engineCC: 2499, cylinders: 4, horsepower: 203, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Lexus", model: "LX", bodyType: "SUV", engineCC: 5663, cylinders: 8, horsepower: 383, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 8 },
  { make: "Lexus", model: "GX", bodyType: "SUV", engineCC: 4608, cylinders: 8, horsepower: 301, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 7 },
  { make: "Lexus", model: "GS", bodyType: "SEDAN", engineCC: 2499, cylinders: 6, horsepower: 204, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5 },
  { make: "Lexus", model: "SC", bodyType: "COUPE", engineCC: 4293, cylinders: 8, horsepower: 300, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 2, seats: 4 },

  // ── JAGUAR ──────────────────────────────────
  { make: "Jaguar", model: "XF", bodyType: "SEDAN", engineCC: 1999, cylinders: 4, horsepower: 163, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "Jaguar", model: "XJ", bodyType: "SEDAN", engineCC: 2993, cylinders: 6, horsepower: 275, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5, turbo: true },
  { make: "Jaguar", model: "F-Pace", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 163, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Jaguar", model: "X-Type", bodyType: "SEDAN", engineCC: 2099, cylinders: 4, horsepower: 130, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Jaguar", model: "E-Pace", bodyType: "SUV", engineCC: 1999, cylinders: 4, horsepower: 150, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5, turbo: true },
  { make: "Jaguar", model: "I-Pace", bodyType: "SUV", engineCC: 0, cylinders: 0, horsepower: 400, fuelType: "ELECTRIC", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 5 },

  // ── PEUGEOT ─────────────────────────────────
  { make: "Peugeot", model: "206", bodyType: "HATCHBACK", engineCC: 1360, cylinders: 4, horsepower: 75, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Peugeot", model: "307", bodyType: "HATCHBACK", engineCC: 1587, cylinders: 4, horsepower: 110, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Peugeot", model: "308", bodyType: "HATCHBACK", engineCC: 1560, cylinders: 4, horsepower: 115, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Peugeot", model: "406", bodyType: "SEDAN", engineCC: 1997, cylinders: 4, horsepower: 135, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Peugeot", model: "407", bodyType: "SEDAN", engineCC: 2179, cylinders: 4, horsepower: 125, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Peugeot", model: "3008", bodyType: "SUV", engineCC: 1560, cylinders: 4, horsepower: 120, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Peugeot", model: "5008", bodyType: "SUV", engineCC: 1560, cylinders: 4, horsepower: 120, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 7, turbo: true },
  { make: "Peugeot", model: "Partner", bodyType: "VAN", engineCC: 1560, cylinders: 4, horsepower: 90, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 2, turbo: true },
  { make: "Peugeot", model: "Boxer", bodyType: "VAN", engineCC: 2198, cylinders: 4, horsepower: 130, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 3, turbo: true },
  { make: "Peugeot", model: "508", bodyType: "SEDAN", engineCC: 1598, cylinders: 4, horsepower: 165, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },

  // ── RENAULT ─────────────────────────────────
  { make: "Renault", model: "Clio", bodyType: "HATCHBACK", engineCC: 1149, cylinders: 4, horsepower: 75, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Renault", model: "Megane", bodyType: "HATCHBACK", engineCC: 1598, cylinders: 4, horsepower: 110, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Renault", model: "Duster", bodyType: "SUV", engineCC: 1461, cylinders: 4, horsepower: 108, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Renault", model: "Koleos", bodyType: "SUV", engineCC: 1998, cylinders: 4, horsepower: 135, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Renault", model: "Captur", bodyType: "SUV", engineCC: 1198, cylinders: 4, horsepower: 110, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Renault", model: "Kangoo", bodyType: "VAN", engineCC: 1461, cylinders: 4, horsepower: 90, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 2, turbo: true },
  { make: "Renault", model: "Talisman", bodyType: "SEDAN", engineCC: 1598, cylinders: 4, horsepower: 150, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 4, seats: 5, turbo: true },
  { make: "Renault", model: "Scenic", bodyType: "MPV", engineCC: 1598, cylinders: 4, horsepower: 110, fuelType: "PETROL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Renault", model: "Trafic", bodyType: "VAN", engineCC: 1997, cylinders: 4, horsepower: 114, fuelType: "DIESEL", transmission: "MANUAL", drivetrain: "FWD", doors: 5, seats: 3, turbo: true },

  // ── JEEP ────────────────────────────────────
  { make: "Jeep", model: "Wrangler", bodyType: "SUV", engineCC: 3604, cylinders: 6, horsepower: 285, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5 },
  { make: "Jeep", model: "Grand Cherokee", bodyType: "SUV", engineCC: 2987, cylinders: 6, horsepower: 243, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5, turbo: true },
  { make: "Jeep", model: "Cherokee", bodyType: "SUV", engineCC: 2360, cylinders: 4, horsepower: 184, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Jeep", model: "Compass", bodyType: "SUV", engineCC: 1998, cylinders: 4, horsepower: 125, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Jeep", model: "Renegade", bodyType: "SUV", engineCC: 1598, cylinders: 4, horsepower: 110, fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5, turbo: true },
  { make: "Jeep", model: "Patriot", bodyType: "SUV", engineCC: 1998, cylinders: 4, horsepower: 158, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },

  // ── DAIHATSU ────────────────────────────────
  { make: "Daihatsu", model: "Terios", bodyType: "SUV", engineCC: 1495, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 5, seats: 5 },
  { make: "Daihatsu", model: "Move", bodyType: "HATCHBACK", engineCC: 659, cylinders: 3, horsepower: 58, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 4 },
  { make: "Daihatsu", model: "Boon", bodyType: "HATCHBACK", engineCC: 1496, cylinders: 4, horsepower: 109, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Daihatsu", model: "Sirion", bodyType: "HATCHBACK", engineCC: 1496, cylinders: 4, horsepower: 103, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Daihatsu", model: "Mira", bodyType: "HATCHBACK", engineCC: 659, cylinders: 3, horsepower: 52, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 4 },
  { make: "Daihatsu", model: "Tanto", bodyType: "HATCHBACK", engineCC: 659, cylinders: 3, horsepower: 58, fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", doors: 5, seats: 4 },
  { make: "Daihatsu", model: "Hijet", bodyType: "VAN", engineCC: 658, cylinders: 3, horsepower: 52, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 4 },

  // ── CHRYSLER ────────────────────────────────
  { make: "Chrysler", model: "300", bodyType: "SEDAN", engineCC: 3604, cylinders: 6, horsepower: 292, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5 },
  { make: "Chrysler", model: "Grand Voyager", bodyType: "MPV", engineCC: 3604, cylinders: 6, horsepower: 283, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Chrysler", model: "Pacifica", bodyType: "MPV", engineCC: 3604, cylinders: 6, horsepower: 287, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 7 },
  { make: "Chrysler", model: "200", bodyType: "SEDAN", engineCC: 2360, cylinders: 4, horsepower: 184, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Chrysler", model: "Sebring", bodyType: "SEDAN", engineCC: 2736, cylinders: 6, horsepower: 186, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Chrysler", model: "Town and Country", bodyType: "MPV", engineCC: 3604, cylinders: 6, horsepower: 283, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 7 },

  // ── DODGE ───────────────────────────────────
  { make: "Dodge", model: "Challenger", bodyType: "COUPE", engineCC: 5654, cylinders: 8, horsepower: 375, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 2, seats: 5 },
  { make: "Dodge", model: "Charger", bodyType: "SEDAN", engineCC: 5654, cylinders: 8, horsepower: 370, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 4, seats: 5 },
  { make: "Dodge", model: "Durango", bodyType: "SUV", engineCC: 3604, cylinders: 6, horsepower: 295, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", doors: 5, seats: 7 },
  { make: "Dodge", model: "Journey", bodyType: "SUV", engineCC: 2360, cylinders: 4, horsepower: 173, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 5, seats: 5 },
  { make: "Dodge", model: "Ram", bodyType: "PICKUP", engineCC: 5654, cylinders: 8, horsepower: 395, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FOURWD", doors: 4, seats: 5 },
  { make: "Dodge", model: "Avenger", bodyType: "SEDAN", engineCC: 2360, cylinders: 4, horsepower: 173, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", doors: 4, seats: 5 },
  { make: "Dodge", model: "Nitro", bodyType: "SUV", engineCC: 3700, cylinders: 6, horsepower: 210, fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "RWD", doors: 5, seats: 5 },
];

// ── Main ──────────────────────────────────────
async function main() {
  log("=== Kenyan Specs + Wikipedia Thumbnails ===");

  let updated = 0;
  let skipped = 0;
  let imageFound = 0;

  // 1. First pass: update specs from curated data
  log(`\n--- Phase 1: Updating specs (${CURATED.length} entries) ---`);

  for (const entry of CURATED) {
    // Find matching records by make + model (case-insensitive)
    const records = await prisma.carModelSpec.findMany({
      where: {
        published: true,
        make: { equals: entry.make, mode: "insensitive" },
        model: { equals: entry.model, mode: "insensitive" },
      },
    });

    if (!records.length) {
      skipped++;
      continue;
    }

    try {
      await prisma.carModelSpec.updateMany({
        where: {
          make: { equals: entry.make, mode: "insensitive" },
          model: { equals: entry.model, mode: "insensitive" },
        },
        data: {
          bodyType: entry.bodyType,
          engineCC: entry.engineCC,
          cylinders: entry.cylinders,
          horsepower: entry.horsepower,
          fuelType: entry.fuelType,
          transmission: entry.transmission,
          drivetrain: entry.drivetrain,
          doors: entry.doors,
          seats: entry.seats,
          turbo: entry.turbo || false,
          verified: true,
          published: true,
        },
      });
      updated += records.length;
      log(`  ✓ ${entry.make} ${entry.model}: ${entry.engineCC}cc ${entry.horsepower}hp (${records.length} records)`);
    } catch (e) {
      log(`  ✗ ${entry.make} ${entry.model}: ${e.message}`);
    }
  }

  log(`\nSpecs: ${updated} records updated, ${skipped} make/model pairs not found`);

  // 2. Second pass: fetch Wikipedia thumbnails for models that don't have one
  log(`\n--- Phase 2: Fetching Wikipedia thumbnails ---`);

  const missingImages = await prisma.carModelSpec.findMany({
    where: {
      published: true,
      imageUrl: null,
    },
    distinct: ["make", "model"],
    select: { make: true, model: true },
  });

  log(`Models without photos: ${missingImages.length}`);

  for (const { make, model } of missingImages) {
    const searchTitle = `${make} ${model}`.replace(/\s+/g, "_");
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTitle)}`,
        { headers: { "User-Agent": "BIDGARI/1.0" }, signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const thumb = data?.thumbnail?.source;
      if (thumb) {
        await prisma.carModelSpec.updateMany({
          where: {
            make: { equals: make, mode: "insensitive" },
            model: { equals: model, mode: "insensitive" },
          },
          data: { imageUrl: thumb },
        });
        imageFound++;
        log(`  ✓ ${make} ${model}: thumbnail found`);
      } else {
        log(`  - ${make} ${model}: no thumbnail`);
      }
    } catch (e) {
      // Try alternative title formats
      const altTitle = `${model}`.replace(/\s+/g, "_");
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(altTitle)}`,
          { headers: { "User-Agent": "BIDGARI/1.0" }, signal: AbortSignal.timeout(10000) }
        );
        if (res.ok) {
          const data = await res.json();
          const thumb = data?.thumbnail?.source;
          if (thumb) {
            await prisma.carModelSpec.updateMany({
              where: {
                make: { equals: make, mode: "insensitive" },
                model: { equals: model, mode: "insensitive" },
              },
              data: { imageUrl: thumb },
            });
            imageFound++;
            log(`  ✓ ${make} ${model}: thumbnail found (alt)`);
          }
        }
      } catch {}
    }
    await sleep(150); // be gentle to Wikipedia
  }

  // Final summary
  const total = await prisma.carModelSpec.count({ where: { published: true } });
  const withImg = await prisma.carModelSpec.count({ where: { published: true, NOT: { imageUrl: null } } });
  const withHp = await prisma.carModelSpec.count({ where: { published: true, NOT: { horsepower: null } } });

  log(`\n=== Done ===`);
  log(`Total published: ${total}`);
  log(`With images: ${withImg} (${Math.round(withImg/total*100)}%)`);
  log(`With horsepower: ${withHp} (${Math.round(withHp/total*100)}%)`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
