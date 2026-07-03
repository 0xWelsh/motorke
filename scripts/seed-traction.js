// scripts/seed-traction.js
// Seeds realistic fake views and lead data so the platform doesn't look empty
// on day one.  Idempotent — safe to run multiple times (appends more data).
//
// Usage:  node scripts/seed-traction.js
//         node scripts/seed-traction.js --confirm

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pick = (arr) => arr[rand(0, arr.length - 1)];

const VIEW_SOURCES = [
  "direct", "direct", "direct",
  "internal",
  "google", "google",
  "facebook",
  "whatsapp",
  "instagram",
  "tiktok",
  "x",
];

// ─── Kenyan name / phone / message generators ───────────────────────────

const FIRST_NAMES = [
  "James", "Mary", "John", "Grace", "Peter", "Faith", "David", "Esther",
  "Daniel", "Sarah", "Samuel", "Elizabeth", "Joseph", "Margaret", "Paul",
  "Jane", "Kevin", "Nancy", "Brian", "Diana", "Patrick", "Agnes", "Michael",
  "Ruth", "George", "Catherine", "Timothy", "Dorcas", "Robert", "Hellen",
  "Alex", "Lucy", "Stephen", "Ann", "Chris", "Rose", "Kennedy", "Priscilla",
  "Vincent", "Monica", "Geoffrey", "Caroline", "Francis", "Veronica", "Collins",
  "Teresa", "Dennis", "Cynthia", "Moses", "Florence",
];

const LAST_NAMES = [
  "Kamau", "Wanjiku", "Muthoni", "Njoroge", "Nyambura", "Omondi", "Akinyi",
  "Kiprop", "Chebet", "Mwangi", "Wambui", "Ndegwa", "Kariuki", "Waithera",
  "Otieno", "Achieng", "Kipkorir", "Jelagat", "Mutua", "Ndungu", "Wekesa",
  "Nasimiyu", "Barasa", "Nekesa", "Odhiambo", "Anyango", "Kipkemoi", "Kosgei",
  "Kinyua", "Njenga", "Macharia", "Waweru", "Githinji", "Kibaki", "Koech",
  "Sigei", "Rono", "Ketter", "Langat", "Mutai", "Cheruiyot", "Biwiott",
  "Sang", "Kemboi", "Towett", "Yego",
];

const LEAD_MESSAGES = [
  "Hi, is this still available? I'd like to come view it this weekend.",
  "What's the final price? I'm a serious buyer.",
  "I'm interested. Can you share more photos of the interior?",
  "Hello, what's the mileage and service history?",
  "Is the price negotiable? I can pay cash.",
  "Where exactly are you located for viewing?",
  "Can you deliver to Nairobi? I'll cover the cost.",
  "I saw this car and I'm very interested. Please call me.",
  "What's the condition of the tyres and brakes?",
  "Do you have a video of the engine running?",
  "Is there a warranty? How many previous owners?",
  "I'd like to take it for a test drive tomorrow morning.",
  "Please send me the full specs including fuel consumption.",
  "What's the insurance status? Can I drive it away today?",
  "How long have you had this listing? Why are you selling?",
  "Hello, is the car still on sale? I'm in Mombasa.",
  "Looks clean! Any known mechanical issues?",
  "I need financing. Does the dealer assist with loans?",
  "What's the import year and is it locally assembled?",
  "I've shared this with my mechanic. He'll call you.",
];

const LEAD_CHANNELS = ["web", "web", "web", "whatsapp", "call"];

function randomPhone() {
  const prefix = pick(["0700", "0711", "0722", "0733", "0743", "0757", "0777", "0789", "0799", "0100", "0110", "0111"]);
  return prefix + String(rand(100000, 999999));
}

function randomEmail(first, last) {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "proton.me"];
  return `${first.toLowerCase()}${last.toLowerCase()}${rand(1, 99)}@${pick(domains)}`;
}

// ─── main ───────────────────────────────────────────────────────────────

async function main() {
  const needsConfirm = !process.argv.includes("--confirm");
  if (needsConfirm) {
    console.log("");
    console.log("  This will seed fake traction data (views + leads) across all active");
    console.log("  car listings.  It is safe to run multiple times — data accumulates.");
    console.log("");
    console.log("  To skip this prompt, run with:  --confirm");
    console.log("  To undo:  node scripts/wipe-dummy-data.js");
    console.log("");
    const confirm = await ask("  Type YES to continue: ");
    if (confirm !== "YES") {
      console.log("  Aborted.");
      process.exit(0);
    }
  }

  const cars = await prisma.car.findMany({
    where: {
      available: true,
      isSold: false,
      dealerId: { not: null },
    },
    include: {
      dealer: { select: { id: true, name: true } },
    },
  });

  if (!cars.length) {
    console.log("No active cars found. Nothing to seed.");
    return;
  }

  console.log(`\nSeeding traction for ${cars.length} active cars...\n`);

  let totalViews = 0;
  let totalLeads = 0;

  for (const car of cars) {
    // ── views ───────────────────────────────────────────────────────────
    // Older listings get more views.  Formula: base = age-in-days × 0.8 + noise
    const ageInDays = Math.max(1, Math.floor((Date.now() - new Date(car.createdAt).getTime()) / 86400000));
    const viewCount = Math.max(rand(5, 20), Math.floor(ageInDays * 0.6 + rand(-5, 15)));
    const sources = [];

    for (let i = 0; i < viewCount; i++) {
      const hoursAgo = Math.max(0, rand(0, ageInDays * 24));
      sources.push({
        carId: car.id,
        sessionKey: rand(100000, 999999).toString(16),
        source: pick(VIEW_SOURCES),
        viewedAt: new Date(Date.now() - hoursAgo * 3600000 - rand(0, 3600000)),
      });
    }

    // Batch insert CarView rows
    if (sources.length) {
      await prisma.carView.createMany({ data: sources });
    }

    // Update denormalized counter
    await prisma.car.update({
      where: { id: car.id },
      data: { views: { increment: sources.length } },
    });

    totalViews += sources.length;

    // ── leads ───────────────────────────────────────────────────────────
    // ~2–6 % of viewers become leads (higher for cheaper cars)
    const leadRatio = car.price < 2000000 ? rand(4, 8) : rand(1, 4);
    const leadCount = Math.max(0, Math.round((viewCount * leadRatio) / 100));

    for (let i = 0; i < leadCount; i++) {
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const channel = pick(LEAD_CHANNELS);
      const daysAgo = rand(0, Math.min(ageInDays, 21));
      const createdAt = new Date(Date.now() - daysAgo * 86400000 - rand(0, 43200000));
      const statuses = ["NEW", "NEW", "NEW", "CONTACTED", "INTERESTED", "NEGOTIATING"];
      const status = pick(statuses);

      const lead = await prisma.lead.create({
        data: {
          carId: car.id,
          dealerId: car.dealerId,
          name: `${first} ${last}`,
          phone: randomPhone(),
          email: randomEmail(first, last),
          message: channel !== "call" ? pick(LEAD_MESSAGES) : null,
          channel,
          createdAt,
          status,
        },
      });

      // Add status history note for non-NEW leads
      if (status !== "NEW" && channel !== "call") {
        const noteDays = rand(0, Math.max(0, daysAgo - 1));
        await prisma.leadNote.create({
          data: {
            leadId: lead.id,
            status,
            note: status === "CONTACTED"
              ? "Followed up with the customer"
              : status === "INTERESTED"
                ? "Customer is still interested, sent more photos"
                : "Negotiating on price",
            createdAt: new Date(Date.now() - noteDays * 86400000),
          },
        });
      }

      totalLeads++;
    }

    // ── whatsappClicks (roughly 30-60% of leads came through whatsapp/call) ──
    const waClicks = Math.round(leadCount * rand(3, 6) / 10);
    if (waClicks > 0) {
      await prisma.car.update({
        where: { id: car.id },
        data: { whatsappClicks: { increment: waClicks } },
      });
    }

    process.stdout.write(".");
  }

  console.log("\n");
  console.log(`  ✓  ${totalViews} views created across ${cars.length} cars`);
  console.log(`  ✓  ${totalLeads} leads created`);
  console.log("\nDone. The platform now looks active.\n");
}

// ─── stdin helper ───────────────────────────────────────────────────────

function ask(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once("data", (data) => resolve(data.toString().trim()));
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
