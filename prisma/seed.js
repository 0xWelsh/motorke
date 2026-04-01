// prisma/seed.js
// Minimal seed — creates accounts only, no fake car listings
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Seeding Motorke (accounts only)...");

  // Clear everything
  await prisma.savedCar.deleteMany().catch(() => {});
  await prisma.lead.deleteMany();
  await prisma.carImage.deleteMany();
  await prisma.car.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dealer.deleteMany();

  // Create 5 placeholder dealerships (no cars yet — add real ones via admin)
  const dealers = await Promise.all([
    prisma.dealer.create({ data: { name: "Prestige Auto Kenya", slug: "prestige-auto", phone: "+254 720 100 200", whatsapp: "254720100200", email: "sales@prestigeauto.co.ke", location: "Westlands, Nairobi", county: "Nairobi", address: "Ring Road Westlands", lat: -1.2641, lng: 36.8037, verified: true, featured: true, description: "Premier destination for certified pre-owned Japanese imports." }}),
    prisma.dealer.create({ data: { name: "Savanna Motors", slug: "savanna-motors", phone: "+254 733 200 300", whatsapp: "254733200300", email: "info@savannamotors.co.ke", location: "Mombasa Road, Nairobi", county: "Nairobi", address: "Enterprise Road, Industrial Area", lat: -1.3192, lng: 36.8553, verified: true, featured: true, description: "Specialists in 4x4s, pickups and SUVs." }}),
    prisma.dealer.create({ data: { name: "Nakuru Auto Mart", slug: "nakuru-auto-mart", phone: "+254 722 400 500", whatsapp: "254722400500", email: "sales@nakuruautomart.co.ke", location: "Nakuru Town, Nakuru", county: "Nakuru", address: "Kenyatta Avenue, Nakuru CBD", lat: -0.2839, lng: 36.0667, verified: true, featured: false, description: "The Rift Valley's largest used car dealer." }}),
    prisma.dealer.create({ data: { name: "Coast Car Centre", slug: "coast-car-centre", phone: "+254 741 600 700", whatsapp: "254741600700", email: "hello@coastcarcentre.co.ke", location: "Nyali, Mombasa", county: "Mombasa", address: "Links Road, Nyali", lat: -4.0374, lng: 39.7055, verified: false, featured: false, description: "Mombasa's trusted dealer since 2008." }}),
    prisma.dealer.create({ data: { name: "Highland Motors Eldoret", slug: "highland-motors-eldoret", phone: "+254 712 800 900", whatsapp: "254712800900", email: "info@highlandmotors.co.ke", location: "Eldoret Town, Uasin Gishu", county: "Uasin Gishu", address: "Uganda Road, Eldoret", lat: 0.5143, lng: 35.2698, verified: false, featured: false, description: "North Rift's go-to dealer for tough, reliable vehicles." }}),
  ]);

  // Admin account
  await prisma.user.create({
    data: { name: "Motorke Admin", email: "11241welshmuhuri@gmail.com", passwordHash: hashPassword("Welsh@2006"), role: "ADMIN", active: true },
  });

  // Dealer accounts
  const creds = [
    { email: "prestige@motorke.co.ke",  password: "prestige123", idx: 0 },
    { email: "savanna@motorke.co.ke",   password: "savanna123",  idx: 1 },
    { email: "nakuru@motorke.co.ke",    password: "nakuru123",   idx: 2 },
    { email: "coast@motorke.co.ke",     password: "coast123",    idx: 3 },
    { email: "highland@motorke.co.ke",  password: "highland123", idx: 4 },
  ];
  for (const { email, password, idx } of creds) {
    await prisma.user.create({
      data: { name: `${dealers[idx].name} Manager`, email, passwordHash: hashPassword(password), role: "DEALER", dealerId: dealers[idx].id, active: true },
    });
  }

  // Demo buyer
  await prisma.user.create({
    data: { name: "Demo Buyer", email: "buyer@motorke.co.ke", passwordHash: hashPassword("buyer123"), role: "BUYER", active: true },
  });

  console.log("\n✅ Seed complete — 5 dealerships, 7 accounts, 0 cars");
  console.log("   Add real cars via /admin/cars/new or bulk CSV upload");
  console.log("\n   11241welshmuhuri@gmail.com     → Welsh@2006");
  console.log("   prestige@motorke.co.ke  → prestige123");
  console.log("   buyer@motorke.co.ke     → buyer123");
}

main().catch(e => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());