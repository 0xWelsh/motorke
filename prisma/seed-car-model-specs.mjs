// prisma/seed-car-model-specs.mjs
// Reference specs for most common Kenyan-market car models.
// Source: manufacturer specs, Japanese catalog data, verified by research.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

// Helper to create year ranges
const yr = (start, end) => ({ yearStart: start, yearEnd: end ?? null });

const SPECS = [
  // ============================================================
  // TOYOTA
  // ============================================================
  // Toyota Harrier — one of the most popular SUVs in Kenya
  { make: "Toyota", model: "Harrier", variant: "Premium", ...yr(2013, 2019),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 2498, cylinders: 4, horsepower: 182, torque: 235,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 195,
    turbo: false, sunroof: true, curbWeightKg: 1650, fuelTankLiters: 60,
    standardFeatures: ["Leather seats", "Sunroof", "Reverse camera", "Keyless entry",
      "Push start", "Blind spot monitor", "Power adjustable seats", "Dual zone AC",
      "JBL sound system", "Electric parking brake"],
    source: "toyota-japan-catalog", verified: true },

  { make: "Toyota", model: "Harrier", variant: "Elegance", ...yr(2013, 2019),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 2498, cylinders: 4, horsepower: 182, torque: 235,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 195,
    turbo: false, sunroof: false, curbWeightKg: 1640, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Reverse camera", "Keyless entry",
      "Push start", "Dual zone AC"],
    source: "toyota-japan-catalog", verified: true },

  { make: "Toyota", model: "Harrier", variant: "G", ...yr(2013, 2019),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 2498, cylinders: 4, horsepower: 182, torque: 235,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 5, groundClearanceMm: 195,
    turbo: false, sunroof: false, curbWeightKg: 1620, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Keyless entry", "Single zone AC"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Vitz — top city car
  { make: "Toyota", model: "Vitz", variant: "F", ...yr(2014, 2019),
    bodyType: "HATCHBACK", vehicleType: "CAR", engineCC: 1496, cylinders: 4, horsepower: 109, torque: 138,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 150,
    turbo: false, sunroof: false, curbWeightKg: 1020, fuelTankLiters: 42,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Axio
  { make: "Toyota", model: "Axio", variant: "G", ...yr(2014, 2019),
    bodyType: "SEDAN", vehicleType: "CAR", engineCC: 1496, cylinders: 4, horsepower: 109, torque: 138,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 4, airbags: 3, groundClearanceMm: 150,
    turbo: false, sunroof: false, curbWeightKg: 1150, fuelTankLiters: 50,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Fielder
  { make: "Toyota", model: "Fielder", variant: "G", ...yr(2014, 2019),
    bodyType: "WAGON", vehicleType: "CAR", engineCC: 1496, cylinders: 4, horsepower: 109, torque: 138,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 155,
    turbo: false, sunroof: false, curbWeightKg: 1190, fuelTankLiters: 50,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Roof rails"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Fielder Hybrid
  { make: "Toyota", model: "Fielder", variant: "G Hybrid", ...yr(2014, 2019),
    bodyType: "WAGON", vehicleType: "CAR", engineCC: 1496, cylinders: 4, horsepower: 109, torque: 138,
    fuelType: "HYBRID", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 155,
    turbo: false, sunroof: false, hybridBatteryTech: "NIMH",
    curbWeightKg: 1240, fuelTankLiters: 50,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Roof rails"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Land Cruiser Prado
  { make: "Toyota", model: "Land Cruiser Prado", variant: "TX", ...yr(2014, 2022),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 2982, cylinders: 4, horsepower: 190, torque: 420,
    fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", steering: "RHD",
    seats: 7, doors: 5, airbags: 9, groundClearanceMm: 220,
    turbo: true, sunroof: true, curbWeightKg: 2170, fuelTankLiters: 87,
    standardFeatures: ["Leather seats", "Sunroof", "Reverse camera", "Keyless entry", "Push start",
      "Multi-terrain select", "Crawl control", "Touchscreen infotainment", "Dual zone AC",
      "Cooled front seats"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Hilux
  { make: "Toyota", model: "Hilux", variant: "Double Cab 4x4", ...yr(2015, 2022),
    bodyType: "PICKUP", vehicleType: "CAR", engineCC: 2755, cylinders: 4, horsepower: 177, torque: 420,
    fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", steering: "RHD",
    seats: 5, doors: 4, airbags: 7, groundClearanceMm: 215,
    turbo: true, sunroof: false, curbWeightKg: 2030, fuelTankLiters: 80,
    standardFeatures: ["Fabric seats", "Reverse camera", "Bluetooth", "Air conditioning",
      "Hill start assist", "Trailer sway control"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Premio
  { make: "Toyota", model: "Premio", variant: "G", ...yr(2012, 2019),
    bodyType: "SEDAN", vehicleType: "CAR", engineCC: 1986, cylinders: 4, horsepower: 152, torque: 193,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 4, airbags: 3, groundClearanceMm: 148,
    turbo: false, sunroof: false, curbWeightKg: 1340, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "CD/radio"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Corolla
  { make: "Toyota", model: "Corolla", variant: "G", ...yr(2014, 2019),
    bodyType: "SEDAN", vehicleType: "CAR", engineCC: 1798, cylinders: 4, horsepower: 140, torque: 170,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 4, airbags: 3, groundClearanceMm: 145,
    turbo: false, sunroof: false, curbWeightKg: 1270, fuelTankLiters: 55,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Bluetooth"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota RAV4
  { make: "Toyota", model: "RAV4", variant: "G", ...yr(2014, 2018),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1987, cylinders: 4, horsepower: 150, torque: 195,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 190,
    turbo: false, sunroof: false, curbWeightKg: 1520, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Bluetooth"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Voxy
  { make: "Toyota", model: "Voxy", variant: "S", ...yr(2014, 2021),
    bodyType: "MINIVAN", vehicleType: "CAR", engineCC: 1986, cylinders: 4, horsepower: 158, torque: 196,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 7, doors: 5, airbags: 5, groundClearanceMm: 170,
    turbo: false, sunroof: false, curbWeightKg: 1660, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Sliding doors", "Keyless entry", "Air conditioning", "Touchscreen"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Noah
  { make: "Toyota", model: "Noah", variant: "S", ...yr(2014, 2021),
    bodyType: "MINIVAN", vehicleType: "CAR", engineCC: 1986, cylinders: 4, horsepower: 158, torque: 196,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 7, doors: 5, airbags: 5, groundClearanceMm: 175,
    turbo: false, sunroof: false, curbWeightKg: 1680, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Sliding doors", "Keyless entry", "Air conditioning"],
    source: "toyota-japan-catalog", verified: true },

  // Toyota Aqua
  { make: "Toyota", model: "Aqua", variant: "S", ...yr(2012, 2019),
    bodyType: "HATCHBACK", vehicleType: "CAR", engineCC: 1496, cylinders: 4, horsepower: 74, torque: 111,
    fuelType: "HYBRID", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 150,
    turbo: false, sunroof: false, hybridBatteryTech: "NIMH",
    curbWeightKg: 1060, fuelTankLiters: 36,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Hybrid system"],
    source: "toyota-japan-catalog", verified: true },

  // ============================================================
  // NISSAN
  // ============================================================
  // Nissan Note
  { make: "Nissan", model: "Note", variant: "S", ...yr(2013, 2020),
    bodyType: "HATCHBACK", vehicleType: "CAR", engineCC: 1198, cylinders: 3, horsepower: 80, torque: 110,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 150,
    turbo: false, sunroof: false, curbWeightKg: 1010, fuelTankLiters: 41,
    standardFeatures: ["Fabric seats", "Air conditioning", "Bluetooth"],
    source: "nissan-japan-catalog", verified: true },

  // Nissan X-Trail
  { make: "Nissan", model: "X-Trail", variant: "G", ...yr(2014, 2021),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1997, cylinders: 4, horsepower: 140, torque: 200,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 7, doors: 5, airbags: 7, groundClearanceMm: 210,
    turbo: false, sunroof: false, curbWeightKg: 1550, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Bluetooth", "Third row seating"],
    source: "nissan-japan-catalog", verified: true },

  // Nissan Juke
  { make: "Nissan", model: "Juke", variant: "S", ...yr(2014, 2019),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1598, cylinders: 4, horsepower: 117, torque: 158,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 180,
    turbo: false, sunroof: false, curbWeightKg: 1200, fuelTankLiters: 46,
    standardFeatures: ["Fabric seats", "Air conditioning", "Bluetooth"],
    source: "nissan-japan-catalog", verified: true },

  // ============================================================
  // MAZDA
  // ============================================================
  // Mazda CX-5
  { make: "Mazda", model: "CX-5", variant: "2.0", ...yr(2014, 2021),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1998, cylinders: 4, horsepower: 155, torque: 200,
    fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 195,
    turbo: false, sunroof: false, curbWeightKg: 1550, fuelTankLiters: 58,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Bluetooth", "Skyactiv technology"],
    source: "mazda-japan-catalog", verified: true },

  { make: "Mazda", model: "CX-5", variant: "2.5 AWD", ...yr(2014, 2021),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 2488, cylinders: 4, horsepower: 190, torque: 250,
    fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "AWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 195,
    turbo: false, sunroof: true, curbWeightKg: 1630, fuelTankLiters: 58,
    standardFeatures: ["Leather seats", "Sunroof", "Bose sound", "HUD", "Keyless entry",
      "Push start", "Power adjustable seats", "Blind spot monitor"],
    source: "mazda-japan-catalog", verified: true },

  // Mazda Demio
  { make: "Mazda", model: "Demio", variant: "S", ...yr(2014, 2019),
    bodyType: "HATCHBACK", vehicleType: "CAR", engineCC: 1496, cylinders: 4, horsepower: 111, torque: 144,
    fuelType: "PETROL", transmission: "AUTOMATIC", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 145,
    turbo: false, sunroof: false, curbWeightKg: 1060, fuelTankLiters: 44,
    standardFeatures: ["Fabric seats", "Air conditioning", "Bluetooth"],
    source: "mazda-japan-catalog", verified: true },

  // ============================================================
  // SUBARU
  // ============================================================
  // Subaru Forester
  { make: "Subaru", model: "Forester", variant: "2.0i", ...yr(2014, 2021),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1995, cylinders: 4, horsepower: 148, torque: 198,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 220,
    turbo: false, sunroof: false, curbWeightKg: 1530, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Air conditioning", "Bluetooth", "Symmetrical AWD", "Hill descent control"],
    source: "subaru-japan-catalog", verified: true },

  { make: "Subaru", model: "Forester", variant: "2.0i EyeSight", ...yr(2014, 2021),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1995, cylinders: 4, horsepower: 148, torque: 198,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 220,
    turbo: false, sunroof: true, curbWeightKg: 1550, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Sunroof", "EyeSight safety suite", "Keyless entry",
      "Push start", "Symmetrical AWD", "X-Mode"],
    source: "subaru-japan-catalog", verified: true },

  // Subaru Outback
  { make: "Subaru", model: "Outback", variant: "2.5i", ...yr(2014, 2021),
    bodyType: "WAGON", vehicleType: "CAR", engineCC: 2498, cylinders: 4, horsepower: 175, torque: 235,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "AWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 200,
    turbo: false, sunroof: true, curbWeightKg: 1600, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Sunroof", "Keyless entry", "Air conditioning",
      "Bluetooth", "Symmetrical AWD", "Roof rails"],
    source: "subaru-japan-catalog", verified: true },

  // ============================================================
  // HONDA
  // ============================================================
  // Honda Fit
  { make: "Honda", model: "Fit", variant: "G", ...yr(2013, 2020),
    bodyType: "HATCHBACK", vehicleType: "CAR", engineCC: 1313, cylinders: 4, horsepower: 99, torque: 119,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 150,
    turbo: false, sunroof: false, curbWeightKg: 1080, fuelTankLiters: 40,
    standardFeatures: ["Fabric seats", "Air conditioning", "Bluetooth", "Magic seats"],
    source: "honda-japan-catalog", verified: true },

  // Honda Vezel
  { make: "Honda", model: "Vezel", variant: "G", ...yr(2013, 2021),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1496, cylinders: 4, horsepower: 130, torque: 155,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 185,
    turbo: false, sunroof: false, curbWeightKg: 1260, fuelTankLiters: 50,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Bluetooth"],
    source: "honda-japan-catalog", verified: true },

  // Honda CR-V
  { make: "Honda", model: "CR-V", variant: "2.0", ...yr(2014, 2020),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1997, cylinders: 4, horsepower: 150, torque: 190,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 7, groundClearanceMm: 190,
    turbo: false, sunroof: false, curbWeightKg: 1530, fuelTankLiters: 58,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Bluetooth"],
    source: "honda-japan-catalog", verified: true },

  // ============================================================
  // SUZUKI
  // ============================================================
  // Suzuki Swift
  { make: "Suzuki", model: "Swift", variant: "G", ...yr(2014, 2020),
    bodyType: "HATCHBACK", vehicleType: "CAR", engineCC: 1242, cylinders: 4, horsepower: 90, torque: 120,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 5, doors: 5, airbags: 3, groundClearanceMm: 150,
    turbo: false, sunroof: false, curbWeightKg: 960, fuelTankLiters: 42,
    standardFeatures: ["Fabric seats", "Air conditioning", "Bluetooth"],
    source: "suzuki-japan-catalog", verified: true },

  // ============================================================
  // MITSUBISHI
  // ============================================================
  // Mitsubishi Pajero
  { make: "Mitsubishi", model: "Pajero", variant: "GLX", ...yr(2014, 2021),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 3200, cylinders: 4, horsepower: 165, torque: 380,
    fuelType: "DIESEL", transmission: "AUTOMATIC", drivetrain: "FOURWD", steering: "RHD",
    seats: 7, doors: 5, airbags: 7, groundClearanceMm: 225,
    turbo: true, sunroof: false, curbWeightKg: 2190, fuelTankLiters: 88,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning",
      "Super Select 4WD", "Hill descent control"],
    source: "mitsubishi-japan-catalog", verified: true },

  // Mitsubishi Outlander
  { make: "Mitsubishi", model: "Outlander", variant: "G", ...yr(2014, 2021),
    bodyType: "SUV", vehicleType: "CAR", engineCC: 1998, cylinders: 4, horsepower: 148, torque: 195,
    fuelType: "PETROL", transmission: "CVT", drivetrain: "FWD", steering: "RHD",
    seats: 7, doors: 5, airbags: 7, groundClearanceMm: 190,
    turbo: false, sunroof: false, curbWeightKg: 1490, fuelTankLiters: 60,
    standardFeatures: ["Fabric seats", "Keyless entry", "Air conditioning", "Third row seating"],
    source: "mitsubishi-japan-catalog", verified: true },
];

async function main() {
  console.log(`Seeding ${SPECS.length} reference specs...`);

  for (const spec of SPECS) {
    const { yearStart, yearEnd, make, model, variant, ...data } = spec;

    // Upsert: if same (make, model, variant, yearStart) exists, update; else create
    await prisma.carModelSpec.upsert({
      where: {
        make_model_variant_yearStart: {
          make, model, variant, yearStart,
        },
      },
      create: spec,
      update: data,
    });
  }

  const count = await prisma.carModelSpec.count();
  console.log(`Done. ${count} reference specs in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
