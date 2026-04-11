// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const CAR_TEMPLATES = [
  { 
    make: "Audi",  
    model: "A4",   
    variant: "allroad",    
    year: 2026, 
    price: 4500000, 
    mil: 33000, 
    fuel: "PETROL", 
    trans: "AUTOMATIC", 
    cc: 3000, 
    body: "WAGON", 
    color: "Glacier White", 
    img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=800" 
  },
  { 
    make: "Toyota",   
    model: "Land Cruiser Prado",     
    variant: "J250",
    year: 2026, 
    price: 17000000, 
    mil: 50000, 
    fuel: "PETROL", 
    trans: "AUTOMATIC", 
    cc: 3000, 
    body: "SUV", 
    color: "Heritage Blue", 
    img: "https://images.unsplash.com/photo-1594568284297-7c64464062b1?q=80&w=800" 
  },
];

async function main() {
  console.log("🌱 Seeding Motorke with Demo Data...");

  // Clear existing
  await prisma.savedCar.deleteMany().catch(() => {});
  await prisma.carReview.deleteMany().catch(() => {});
  await prisma.dealerReview.deleteMany().catch(() => {});
  await prisma.leadNote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.carView.deleteMany();
  await prisma.carImage.deleteMany();
  await prisma.car.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.dealer.deleteMany();

  // Create Dealer
  const autogrid = await prisma.dealer.create({
    data: {
      name: "AutoGrid Motors",
      slug: "autogrid-motors",
      phone: "+254 700 111 222",
      whatsapp: "254700111222",
      location: "Karen, Nairobi",
      verified: true,
      featured: true,
      description: "Nairobi's premium destination for high-end Land Cruisers and European luxury wagons.",
    }
  });

  // Create Users
  await prisma.user.create({
    data: { name: "Welsh Admin", email: "11241welshmuhuri@gmail.com", passwordHash: hashPassword("Welsh@2006"), role: "ADMIN" }
  });

  await prisma.user.create({
    data: { name: "AutoGrid Manager", email: "manager@autogrid.co.ke", passwordHash: hashPassword("autogrid123"), role: "DEALER", dealerId: autogrid.id }
  });

  // Create Cars for AutoGrid
  for (const t of CAR_TEMPLATES) {
    const car = await prisma.car.create({
      data: {
        dealerId: autogrid.id,
        make: t.make,
        model: t.model,
        variant: t.variant,
        year: t.year,
        price: t.price,
        mileage: t.mil,
        fuelType: t.fuel,
        transmission: t.trans,
        engineCC: t.cc,
        bodyType: t.body,
        color: t.color,
        description: `Stunning ${t.year} ${t.make} ${t.model} in ${t.color}. Immaculate condition, fully loaded with safety features and modern tech.`,
        features: ["Keyless Entry", "Push Start", "Reverse Camera", "Alloy Wheels", "Leather Interior"],
        images: { create: [{ url: t.img, isPrimary: true, order: 0 }] }
      }
    });

    // Generate fake views for the last 14 days
    const now = new Date();
    for (let i = 0; i < 14; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dailyViews = Math.floor(Math.random() * 15) + 5;
        for (let j = 0; j < dailyViews; j++) {
            await prisma.carView.create({ data: { carId: car.id, viewedAt: date, source: Math.random() > 0.5 ? "direct" : "search" } });
        }
    }

    // Generate 1-3 leads per car
    const numLeads = Math.floor(Math.random() * 3) + 1;
    for (let l = 0; l < numLeads; l++) {
        await prisma.lead.create({
            data: {
                carId: car.id,
                dealerId: autogrid.id,
                name: `Buyer ${l + 1}`,
                phone: `+254 700 000 00${l}`,
                message: `Hi, I'm interested in the ${t.make} ${t.model}. Is it still available?`,
                status: l === 0 ? "NEW" : "CONTACTED"
            }
        });
    }
  }

  // Create reviewer users and their reviews
  const reviewerNames = [
    "James Mwangi",
    "Sarah Kipchoge",
    "Mark Omondi",
    "Priya Patel",
    "David Kariuki",
    "Lisa Mwaluko",
  ];

  const reviewerUsers = await Promise.all(
    reviewerNames.map((name, idx) =>
      prisma.user.create({
        data: {
          name,
          email: `reviewer${idx + 1}@motorke.ke`,
          passwordHash: hashPassword("Password123"),
          role: "USER",
        },
      })
    )
  );

  // Fetch all cars
  const allCars = await prisma.car.findMany();

  // Add car reviews
  const carReviewComments = [
    "Excellent condition! Runs smoothly and all features work perfectly. Highly recommend!",
    "Great car for the price. Very comfortable on long drives. Will definitely buy from this dealer again.",
    "Perfect family SUV. Spacious interior and very safe. Seller was helpful throughout.",
    "Impressive performance and fuel efficiency. Better than I expected for this model year.",
    "Beautiful finish and attention to detail. This is a keeper!",
    "Very reliable vehicle. Had it for 6 months now with zero issues. Great investment.",
  ];

  for (const car of allCars) {
    // Add 3-5 reviews per car
    const numReviews = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < numReviews; i++) {
      const randomUser = reviewerUsers[Math.floor(Math.random() * reviewerUsers.length)];
      const randomRating = [4, 4, 4, 5, 5, 5][Math.floor(Math.random() * 6)];
      const randomComment =
        carReviewComments[Math.floor(Math.random() * carReviewComments.length)];

      await prisma.carReview.upsert({
        where: {
          carId_userId: {
            carId: car.id,
            userId: randomUser.id,
          },
        },
        create: {
          carId: car.id,
          userId: randomUser.id,
          rating: randomRating,
          comment: randomComment,
        },
        update: {
          rating: randomRating,
          comment: randomComment,
        },
      });
    }
  }

  // Add dealer reviews
  const dealerReviewComments = [
    "Professional team, great selection of vehicles. Will definitely return.",
    "Smooth transaction. Staff was knowledgeable and helpful. Highly satisfied!",
    "Fair pricing and honest about car conditions. Reliable dealer!",
    "Quick process and no hidden charges. Excellent customer service!",
    "Best dealer experience I've had. They really care about customer satisfaction.",
  ];

  for (let i = 0; i < 5; i++) {
    const randomUser = reviewerUsers[i % reviewerUsers.length];
    const randomRating = [4, 4, 5, 5, 5][i % 5];
    const randomComment =
      dealerReviewComments[Math.floor(Math.random() * dealerReviewComments.length)];

    await prisma.dealerReview.upsert({
      where: {
        dealerId_userId: {
          dealerId: autogrid.id,
          userId: randomUser.id,
        },
      },
      create: {
        dealerId: autogrid.id,
        userId: randomUser.id,
        rating: randomRating,
        comment: randomComment,
      },
      update: {
        rating: randomRating,
        comment: randomComment,
      },
    });
  }

  console.log("\n✅ Seed complete!");
  console.log("   - 1 Dealership (AutoGrid Motors)");
  console.log("   - 2 Premium Cars");
  console.log("   - ~400 Car Views");
  console.log("   - ~6 Leads");
  console.log(`   - 6 Reviewer Users`);
  console.log(`   - ${allCars.length * 4} Car Reviews (avg 4 per car)`);
  console.log(`   - 5 Dealer Reviews`);
}

main().catch(e => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());