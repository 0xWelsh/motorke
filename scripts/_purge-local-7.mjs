import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const DAY = 86400000;

const cutoff = new Date(Date.now() - 7 * DAY);
const cars = await db.car.findMany({
  where: { imported: false, createdAt: { lt: cutoff } },
  include: { images: true, _count: { select: { leads: true } } },
  orderBy: { createdAt: "asc" },
});

const stats = { cutoff: cutoff.toISOString(), total: cars.length, deleted: 0, failures: [] };
for (const car of cars) {
  try {
    await db.lead.deleteMany({ where: { carId: car.id } });
    await db.carView.deleteMany({ where: { carId: car.id } });
    await db.savedCar.deleteMany({ where: { carId: car.id } });
    await db.carImage.deleteMany({ where: { carId: car.id } });
    await db.car.delete({ where: { id: car.id } });
    stats.deleted += 1;
  } catch (err) {
    stats.failures.push({ id: car.id, name: `${car.year} ${car.make} ${car.model}`, error: (err && err.message) || String(err) });
  }
}
console.log(JSON.stringify(stats, null, 1));
await db.$disconnect();
