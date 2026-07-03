// scripts/bump-views-30x.js
// Multiplies ALL car view counters by 30 so the platform looks well-established.
// Also bumps whatsappClicks and optionally duplicates CarView rows for chart fidelity.
//
// Usage:  node scripts/bump-views-30x.js
//         node scripts/bump-views-30x.js --confirm

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MULTIPLIER = 30;

async function main() {
  const needsConfirm = !process.argv.includes("--confirm");
  if (needsConfirm) {
    console.log("");
    console.log(`  This will multiply ALL car view counters by ${MULTIPLIER}x`);
    console.log("  and optionally duplicate CarView event rows for chart accuracy.");
    console.log("");
    console.log("  To skip this prompt, run with:  --confirm");
    console.log("");
    const confirm = await ask("  Type YES to continue: ");
    if (confirm !== "YES") {
      console.log("  Aborted.");
      process.exit(0);
    }
  }

  // ── 1. Bump denormalized counters ─────────────────────────────────────
  const cars = await prisma.car.findMany({
    where: { dealerId: { not: null } },
    select: { id: true, views: true, whatsappClicks: true },
  });

  console.log(`\n  Found ${cars.length} cars. Multiplying views by ${MULTIPLIER}x...\n`);

  let totalOldViews = 0;
  let totalNewViews = 0;

  for (const car of cars) {
    const newViews = Math.max(1, car.views * MULTIPLIER);
    const newWaClicks = Math.max(0, (car.whatsappClicks || 0) * MULTIPLIER);

    await prisma.car.update({
      where: { id: car.id },
      data: {
        views: newViews,
        whatsappClicks: newWaClicks,
      },
    });

    totalOldViews += car.views;
    totalNewViews += newViews;
  }

  console.log(`  ✓  ${totalOldViews.toLocaleString()} → ${totalNewViews.toLocaleString()} total views`);
  console.log(`\n  Denormalized counters bumped.\n`);

  // ── 2. Optionally duplicate CarView rows ──────────────────────────────
  const dupViews = process.argv.includes("--dup-views");
  if (dupViews) {
    console.log("  Duplicating CarView event rows for chart accuracy...");

    const existing = await prisma.carView.findMany({
      select: { carId: true, userId: true, sessionKey: true, viewedAt: true, source: true },
    });

    console.log(`  Found ${existing.length} existing CarView rows.`);

    const extraRows = [];
    for (const row of existing) {
      for (let i = 0; i < MULTIPLIER - 1; i++) {
        // Offset each duplicate view by a few seconds so it looks organic
        const offsetMs = (i + 1) * 137 + Math.floor(Math.random() * 5000);
        extraRows.push({
          carId: row.carId,
          userId: row.userId,
          sessionKey: row.sessionKey ? `${row.sessionKey}-${i}` : null,
          source: row.source,
          viewedAt: new Date(row.viewedAt.getTime() + offsetMs),
        });

        // Batch in chunks of 1000 to stay within Prisma limits
        if (extraRows.length >= 1000) {
          await prisma.carView.createMany({ data: extraRows, skipDuplicates: true });
          extraRows.length = 0;
        }
      }
    }

    if (extraRows.length) {
      await prisma.carView.createMany({ data: extraRows, skipDuplicates: true });
    }

    console.log(`  ✓  CarView event rows duplicated.\n`);
  }

  console.log("Done. Views now look 30x more established.\n");
}

function ask(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once("data", (data) => resolve(data.toString().trim()));
  });
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
