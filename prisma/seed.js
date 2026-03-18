// prisma/seed.js
// Run: node prisma/seed.js
// Requires DATABASE_URL set in .env

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Realistic Nairobi car images (using public Unsplash/placeholder URLs) ──
// In production replace with actual car photos from your media storage
const IMG = {
  hilux:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
  prado:    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
  fielder:  "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800",
  axio:     "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800",
  harrier:  "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800",
  forester: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800",
  demio:    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
  cx5:      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
  outlander:"https://images.unsplash.com/photo-1619767886558-efdc259b6e09?w=800",
  vitz:     "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
  landcruiser:"https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800",
  premio:   "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800",
};

async function main() {
  console.log("🌱 Seeding Motorke database...");

  // ── 1. Clear existing data ──────────────────────────────────
  await prisma.lead.deleteMany();
  await prisma.carImage.deleteMany();
  await prisma.car.deleteMany();
  await prisma.dealer.deleteMany();
  console.log("  ✓ Cleared existing data");

  // ── 2. Create dealerships ───────────────────────────────────
  const dealers = await prisma.$transaction([

    prisma.dealer.create({ data: {
      name:        "Prestige Auto Kenya",
      slug:        "prestige-auto-kenya",
      description: "Nairobi's premier destination for certified pre-owned Japanese imports. Over 15 years serving Kenyan drivers.",
      phone:       "+254 720 100 200",
      whatsapp:    "254720100200",
      email:       "sales@prestigeauto.co.ke",
      location:    "Westlands, Nairobi",
      county:      "Nairobi",
      address:     "Ring Road Westlands, opposite Sarit Centre",
      lat:         -1.2641,
      lng:          36.8037,
      verified:    true,
      featured:    true,
    }}),

    prisma.dealer.create({ data: {
      name:        "Savanna Motors",
      slug:        "savanna-motors",
      description: "Specialists in 4x4s and pickups — the workhorses of Kenya. New and used stock, flexible financing available.",
      phone:       "+254 733 200 300",
      whatsapp:    "254733200300",
      email:       "info@savannamotors.co.ke",
      location:    "Industrial Area, Nairobi",
      county:      "Nairobi",
      address:     "Mombasa Road, near JKIA turnoff",
      lat:         -1.3192,
      lng:          36.8553,
      verified:    true,
      featured:    true,
    }}),

    prisma.dealer.create({ data: {
      name:        "Nakuru Auto Mart",
      slug:        "nakuru-auto-mart",
      description: "The Rift Valley's largest used car dealer. We source directly from Japan — no middlemen, honest prices.",
      phone:       "+254 722 400 500",
      whatsapp:    "254722400500",
      email:       "sales@nakuruautomart.co.ke",
      location:    "Nakuru Town, Nakuru",
      county:      "Nakuru",
      address:     "Kenyatta Avenue, Nakuru CBD",
      lat:         -0.2839,
      lng:          36.0667,
      verified:    true,
      featured:    false,
    }}),

    prisma.dealer.create({ data: {
      name:        "Coast Car Centre",
      slug:        "coast-car-centre",
      description: "Mombasa's trusted dealer since 2008. Specialising in family SUVs and economy hatchbacks.",
      phone:       "+254 741 600 700",
      whatsapp:    "254741600700",
      email:       "hello@coastcarcentre.co.ke",
      location:    "Nyali, Mombasa",
      county:      "Mombasa",
      address:     "Links Road, Nyali",
      lat:         -4.0374,
      lng:          39.7055,
      verified:    false,
      featured:    false,
    }}),

    prisma.dealer.create({ data: {
      name:        "Highland Motors Eldoret",
      slug:        "highland-motors-eldoret",
      description: "North Rift's go-to dealer for tough, reliable vehicles. Serving farmers, businesses and families since 2010.",
      phone:       "+254 712 800 900",
      whatsapp:    "254712800900",
      email:       "info@highlandmotors.co.ke",
      location:    "Eldoret Town, Uasin Gishu",
      county:      "Uasin Gishu",
      address:     "Uganda Road, Eldoret",
      lat:         0.5143,
      lng:          35.2698,
      verified:    false,
      featured:    false,
    }}),

  ]);

  const [prestige, savanna, nakuru, coast, highland] = dealers;
  console.log(`  ✓ Created ${dealers.length} dealerships`);

  // ── 3. Create cars ──────────────────────────────────────────
  const carsData = [

    // ── PRESTIGE AUTO KENYA ──────────────────────────────────
    {
      dealerId: prestige.id,
      make: "Toyota", model: "Harrier", variant: "2.0 Premium", year: 2019,
      price: 4200000, mileage: 38000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "SUV", color: "Pearl White", engineCC: 1998, seats: 5,
      features: ["Panoramic sunroof", "Leather seats", "360-degree camera", "Apple CarPlay", "Heated seats", "Keyless entry"],
      description: "One owner, accident-free. Full service history. Imported directly from Japan, duty fully paid. Premium condition inside and out.",
      images: [{ url: IMG.harrier, isPrimary: true, alt: "Toyota Harrier 2019 Pearl White" }],
      featured: true,
    },
    {
      dealerId: prestige.id,
      make: "Toyota", model: "Land Cruiser Prado", variant: "TX 2.8D", year: 2018,
      price: 7800000, mileage: 62000, fuelType: "DIESEL", transmission: "AUTOMATIC",
      bodyType: "SUV", color: "Silver", engineCC: 2755, seats: 7, driveType: "FOURWD",
      features: ["7 seats", "4WD low/high", "Hill descent control", "Sunroof", "Leather interior", "Diff lock"],
      description: "Kenyan registered. NTSA compliant. This Prado is a beast — perfect for both Nairobi traffic and upcountry terrain.",
      images: [{ url: IMG.prado, isPrimary: true, alt: "Toyota Prado 2018 Silver" }],
      featured: true,
    },
    {
      dealerId: prestige.id,
      make: "Toyota", model: "Axio", variant: "Hybrid G", year: 2017,
      price: 1150000, mileage: 54000, fuelType: "HYBRID", transmission: "CVT",
      bodyType: "SEDAN", color: "White", engineCC: 1496, seats: 5,
      features: ["Hybrid engine", "Reverse camera", "Push start", "Alloy wheels", "Cruise control"],
      description: "Fuel-efficient hybrid — ideal for daily Nairobi commuting. Low running costs, excellent fuel economy.",
      images: [{ url: IMG.axio, isPrimary: true, alt: "Toyota Axio Hybrid 2017" }],
      featured: false,
    },
    {
      dealerId: prestige.id,
      make: "Toyota", model: "Fielder", variant: "1.5G", year: 2016,
      price: 980000, mileage: 71000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "WAGON", color: "Silver", engineCC: 1496, seats: 5,
      features: ["Spacious boot", "Alloy wheels", "Reverse camera", "Keyless entry", "Push start"],
      description: "Kenya's most popular family wagon. This one is clean, well maintained, and ready to drive.",
      images: [{ url: IMG.fielder, isPrimary: true, alt: "Toyota Fielder 2016" }],
      featured: false,
    },
    {
      dealerId: prestige.id,
      make: "Subaru", model: "Forester", variant: "2.0i Premium AWD", year: 2018,
      price: 2650000, mileage: 49000, fuelType: "PETROL", transmission: "CVT",
      bodyType: "SUV", color: "Dark Blue", engineCC: 1995, driveType: "AWD",
      features: ["Symmetrical AWD", "EyeSight safety", "Panoramic sunroof", "Apple CarPlay", "8-inch touchscreen"],
      description: "Subaru reliability at its best. AWD system handles Nairobi's unpredictable roads effortlessly.",
      images: [{ url: IMG.forester, isPrimary: true, alt: "Subaru Forester 2018 Blue" }],
      featured: false,
    },

    // ── SAVANNA MOTORS ───────────────────────────────────────
    {
      dealerId: savanna.id,
      make: "Toyota", model: "Hilux", variant: "Double Cab 4x4 GD6", year: 2020,
      price: 5500000, mileage: 45000, fuelType: "DIESEL", transmission: "MANUAL",
      bodyType: "PICKUP", color: "White", engineCC: 2755, driveType: "FOURWD", seats: 5,
      features: ["4WD low/high", "Diff lock", "Bull bar", "Tonneau cover", "Tow bar", "Nudge bar"],
      description: "The benchmark for tough. This Hilux has done light duty and is in excellent condition. Perfect for farms, construction, and off-road.",
      images: [{ url: IMG.hilux, isPrimary: true, alt: "Toyota Hilux Double Cab 2020" }],
      featured: true,
    },
    {
      dealerId: savanna.id,
      make: "Toyota", model: "Hilux", variant: "Single Cab 4x2", year: 2019,
      price: 3200000, mileage: 68000, fuelType: "DIESEL", transmission: "MANUAL",
      bodyType: "PICKUP", color: "White", engineCC: 2494, driveType: "RHD",
      features: ["Workhorse setup", "Towbar", "Load liner", "Service history"],
      description: "Proven workhorse single cab. Ideal for small businesses and farms. Clean and reliable.",
      images: [{ url: IMG.hilux, isPrimary: true, alt: "Toyota Hilux Single Cab 2019" }],
      featured: false,
    },
    {
      dealerId: savanna.id,
      make: "Toyota", model: "Land Cruiser", variant: "V8 200 Series", year: 2016,
      price: 9800000, mileage: 88000, fuelType: "DIESEL", transmission: "AUTOMATIC",
      bodyType: "SUV", color: "Black", engineCC: 4461, driveType: "FOURWD", seats: 8,
      features: ["V8 diesel", "8 seats", "Mark Levinson sound", "Rear entertainment", "Multi-terrain select", "Crawl control"],
      description: "The king of Kenya's roads. V8 diesel power, legendary reliability, and unmatched prestige.",
      images: [{ url: IMG.landcruiser, isPrimary: true, alt: "Toyota Land Cruiser V8 2016 Black" }],
      featured: true,
    },
    {
      dealerId: savanna.id,
      make: "Mitsubishi", model: "Outlander", variant: "2.4 PHEV AWD", year: 2019,
      price: 3800000, mileage: 41000, fuelType: "HYBRID", transmission: "AUTOMATIC",
      bodyType: "SUV", color: "Titanium Grey", engineCC: 2360, driveType: "AWD", seats: 7,
      features: ["Plug-in hybrid", "AWD", "7 seats", "Adaptive cruise", "Lane departure warning", "360 camera"],
      description: "Future-proof hybrid SUV with full AWD. Charges overnight from a standard socket. Save on fuel in Nairobi.",
      images: [{ url: IMG.outlander, isPrimary: true, alt: "Mitsubishi Outlander PHEV 2019" }],
      featured: false,
    },
    {
      dealerId: savanna.id,
      make: "Mazda", model: "CX-5", variant: "2.5 Skyactiv AWD", year: 2020,
      price: 4100000, mileage: 33000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "SUV", color: "Soul Red Crystal", engineCC: 2488, driveType: "AWD",
      features: ["i-Activ AWD", "Bose sound system", "HUD display", "Apple CarPlay", "Leather seats", "Sunroof"],
      description: "Mazda's award-winning SUV in the stunning Soul Red Crystal. One of the best driving SUVs in its class.",
      images: [{ url: IMG.cx5, isPrimary: true, alt: "Mazda CX-5 2020 Soul Red" }],
      featured: true,
    },

    // ── NAKURU AUTO MART ─────────────────────────────────────
    {
      dealerId: nakuru.id,
      make: "Toyota", model: "Premio", variant: "1.8 F Premium", year: 2015,
      price: 1350000, mileage: 85000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "SEDAN", color: "Pearl White", engineCC: 1794, seats: 5,
      features: ["Push start", "Alloy wheels", "Reverse camera", "Leather seats", "Climate control"],
      description: "Nakuru's favourite executive sedan. Spacious, comfortable, and impressively fuel efficient.",
      images: [{ url: IMG.premio, isPrimary: true, alt: "Toyota Premio 2015 White" }],
      featured: true,
    },
    {
      dealerId: nakuru.id,
      make: "Toyota", model: "Fielder", variant: "1.5G Hybrid", year: 2018,
      price: 1250000, mileage: 58000, fuelType: "HYBRID", transmission: "CVT",
      bodyType: "WAGON", color: "Silver", engineCC: 1496, seats: 5,
      features: ["Hybrid engine", "Reverse camera", "Bluetooth", "Keyless entry"],
      description: "Hybrid Fielder — excellent for both town and upcountry. Very low running costs.",
      images: [{ url: IMG.fielder, isPrimary: true, alt: "Toyota Fielder Hybrid 2018" }],
      featured: false,
    },
    {
      dealerId: nakuru.id,
      make: "Subaru", model: "Outback", variant: "3.6R AWD", year: 2016,
      price: 2200000, mileage: 74000, fuelType: "PETROL", transmission: "CVT",
      bodyType: "WAGON", color: "Dark Green", engineCC: 3598, driveType: "AWD",
      features: ["Symmetrical AWD", "Raised ground clearance", "EyeSight", "Power tailgate", "Panoramic sunroof"],
      description: "The Outback handles Nakuru's terrain like nothing else. AWD plus wagon space makes this incredibly versatile.",
      images: [{ url: IMG.forester, isPrimary: true, alt: "Subaru Outback 2016 Green" }],
      featured: false,
    },
    {
      dealerId: nakuru.id,
      make: "Mazda", model: "Demio", variant: "1.3 Skyactiv", year: 2017,
      price: 750000, mileage: 62000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "HATCHBACK", color: "Red", engineCC: 1298, seats: 5,
      features: ["Skyactiv engine", "Touchscreen audio", "Reverse camera", "Push start", "Alloy wheels"],
      description: "Kenya's most fun-to-drive hatchback. Incredibly fuel efficient and easy to park in town.",
      images: [{ url: IMG.demio, isPrimary: true, alt: "Mazda Demio 2017 Red" }],
      featured: true,
    },
    {
      dealerId: nakuru.id,
      make: "Toyota", model: "Vitz", variant: "1.0 F Smart Stop", year: 2016,
      price: 620000, mileage: 78000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "HATCHBACK", color: "Blue", engineCC: 998, seats: 5,
      features: ["Idling stop", "Bluetooth audio", "Electric windows", "Central locking"],
      description: "Perfect first car or second car. Cheap to insure, cheap to fuel, easy to drive everywhere.",
      images: [{ url: IMG.vitz, isPrimary: true, alt: "Toyota Vitz 2016 Blue" }],
      featured: false,
    },

    // ── COAST CAR CENTRE ─────────────────────────────────────
    {
      dealerId: coast.id,
      make: "Toyota", model: "Harrier", variant: "2.0 Elegance", year: 2017,
      price: 3100000, mileage: 67000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "SUV", color: "Black", engineCC: 1998, seats: 5,
      features: ["Sunroof", "Leather seats", "Reverse camera", "Keyless entry", "Alloy wheels"],
      description: "Mombasa owned, well maintained. Slight Coast premium but this car is spotless.",
      images: [{ url: IMG.harrier, isPrimary: true, alt: "Toyota Harrier 2017 Black" }],
      featured: true,
    },
    {
      dealerId: coast.id,
      make: "Mazda", model: "Demio", variant: "1.5 XD Diesel", year: 2018,
      price: 920000, mileage: 44000, fuelType: "DIESEL", transmission: "AUTOMATIC",
      bodyType: "HATCHBACK", color: "White", engineCC: 1499, seats: 5,
      features: ["Diesel engine", "i-stop", "Touchscreen", "Reverse camera", "Alloy wheels"],
      description: "The diesel Demio is rare and highly sought after. Returns up to 25km/l. Ideal for Coast road trips.",
      images: [{ url: IMG.demio, isPrimary: true, alt: "Mazda Demio XD Diesel 2018" }],
      featured: true,
    },
    {
      dealerId: coast.id,
      make: "Toyota", model: "Axio", variant: "1.5 X", year: 2015,
      price: 850000, mileage: 92000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "SEDAN", color: "Silver", engineCC: 1496, seats: 5,
      features: ["Reverse camera", "Alloy wheels", "Central locking"],
      description: "Honest mileage, honest price. Good runner, well maintained. Perfect town car.",
      images: [{ url: IMG.axio, isPrimary: true, alt: "Toyota Axio 2015 Silver" }],
      featured: false,
    },
    {
      dealerId: coast.id,
      make: "Toyota", model: "Land Cruiser Prado", variant: "3.0D VX", year: 2014,
      price: 5900000, mileage: 118000, fuelType: "DIESEL", transmission: "AUTOMATIC",
      bodyType: "SUV", color: "Gold", engineCC: 2982, driveType: "FOURWD", seats: 7,
      features: ["V6 diesel", "7 seats", "4WD", "Leather", "Rear camera", "Dual sunroof"],
      description: "Slightly higher mileage but priced accordingly. Full Prado capability at a great price point.",
      images: [{ url: IMG.prado, isPrimary: true, alt: "Toyota Prado 2014 Gold" }],
      featured: false,
    },

    // ── HIGHLAND MOTORS ELDORET ──────────────────────────────
    {
      dealerId: highland.id,
      make: "Toyota", model: "Hilux", variant: "4x4 Extra Cab", year: 2018,
      price: 4200000, mileage: 72000, fuelType: "DIESEL", transmission: "MANUAL",
      bodyType: "PICKUP", color: "Grey", engineCC: 2755, driveType: "FOURWD",
      features: ["4WD", "Extra cab", "Tow bar", "Hard tonneau", "Auxiliary lights"],
      description: "Eldoret farm-ready Hilux. Serviced at authorised Toyota dealer throughout its life.",
      images: [{ url: IMG.hilux, isPrimary: true, alt: "Toyota Hilux Extra Cab 2018" }],
      featured: true,
    },
    {
      dealerId: highland.id,
      make: "Subaru", model: "Forester", variant: "2.0 AWD XT", year: 2015,
      price: 1800000, mileage: 91000, fuelType: "PETROL", transmission: "CVT",
      bodyType: "SUV", color: "Dark Grey", engineCC: 1995, driveType: "AWD",
      features: ["Turbocharged", "AWD", "Sunroof", "Alloy wheels", "Fog lights"],
      description: "Turbo Forester at a bargain price. AWD and ground clearance eat Eldoret's rough roads.",
      images: [{ url: IMG.forester, isPrimary: true, alt: "Subaru Forester XT 2015" }],
      featured: false,
    },
    {
      dealerId: highland.id,
      make: "Toyota", model: "Fielder", variant: "1.8G 4WD", year: 2017,
      price: 1450000, mileage: 66000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "WAGON", color: "White", engineCC: 1794, driveType: "FOURWD",
      features: ["4WD", "Spacious wagon", "Alloy wheels", "Reverse camera", "7 seats"],
      description: "The 4WD Fielder is rare and valuable. Handles muddy farm tracks with ease while remaining practical for town.",
      images: [{ url: IMG.fielder, isPrimary: true, alt: "Toyota Fielder 4WD 2017" }],
      featured: true,
    },
    {
      dealerId: highland.id,
      make: "Mazda", model: "CX-5", variant: "2.0 Skyactiv", year: 2017,
      price: 2800000, mileage: 58000, fuelType: "PETROL", transmission: "AUTOMATIC",
      bodyType: "SUV", color: "White", engineCC: 1998, seats: 5,
      features: ["i-Activ AWD", "Sunroof", "Leather seats", "Apple CarPlay", "Blind spot monitor"],
      description: "Eldoret price on a premium SUV. Mazda's build quality is exceptional and this one proves it.",
      images: [{ url: IMG.cx5, isPrimary: true, alt: "Mazda CX-5 2017 White" }],
      featured: false,
    },

  ];

  let carCount = 0;
  for (const { images, ...carData } of carsData) {
    await prisma.car.create({
      data: {
        ...carData,
        imported: true,
        importCountry: "Japan",
        dutyPaid: true,
        images: {
          create: images,
        },
      },
    });
    carCount++;
  }

  console.log(`  ✓ Created ${carCount} car listings`);
  await createUsers(dealers);
  console.log("\n✅ Seed complete!");
  console.log(`   ${dealers.length} dealerships across Kenya`);
  console.log(`   ${carCount} car listings ready`);
  console.log("\n   Run: npm run dev — then open http://localhost:3000");
}

// ── 4. Create admin + dealer portal accounts ────────────────
async function createUsers(dealers) {
  const crypto = require("crypto");

  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
  }

  // Admin account
  await prisma.user.upsert({
    where:  { email: "admin@motorke.co.ke" },
    update: {},
    create: {
      name:         "Motorke Admin",
      email:        "admin@motorke.co.ke",
      passwordHash: hashPassword("admin1234"),
      role:         "ADMIN",
      active:       true,
    },
  });

  // One dealer account per dealership
  const dealerPasswords = [
    { dealer: dealers[0], email: "prestige@motorke.co.ke",  password: "prestige123" },
    { dealer: dealers[1], email: "savanna@motorke.co.ke",   password: "savanna123"  },
    { dealer: dealers[2], email: "nakuru@motorke.co.ke",    password: "nakuru123"   },
    { dealer: dealers[3], email: "coast@motorke.co.ke",     password: "coast123"    },
    { dealer: dealers[4], email: "highland@motorke.co.ke",  password: "highland123" },
  ];

  for (const { dealer, email, password } of dealerPasswords) {
    await prisma.user.upsert({
      where:  { email },
      update: {},
      create: {
        name:         `${dealer.name} Manager`,
        email,
        passwordHash: hashPassword(password),
        role:         "DEALER",
        dealerId:     dealer.id,
        active:       true,
      },
    });
  }

  console.log("  ✓ Created admin + 5 dealer accounts");
  console.log("\n  Login credentials:");
  console.log("  ┌─────────────────────────────────────────────────────┐");
  console.log("  │ Admin   admin@motorke.co.ke        admin1234        │");
  console.log("  │ Dealer  prestige@motorke.co.ke     prestige123      │");
  console.log("  │ Dealer  savanna@motorke.co.ke      savanna123       │");
  console.log("  └─────────────────────────────────────────────────────┘");
  console.log("  ⚠️  Change all passwords before going to production!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
