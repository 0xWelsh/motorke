import { db } from "./src/lib/db.js";
import { computeLandedPriceForDb } from "./src/lib/duty.js";

async function main() {
  const cars = await db.car.findMany({ select: { id: true, price: true, dutyPaid: true, year: true, engineCC: true, fuelType: true } });
  console.log(`Found ${cars.length} cars.`);
  
  for (const car of cars) {
    const computed = await computeLandedPriceForDb(car.price, car.dutyPaid, car.year, car.engineCC, car.fuelType);
    await db.car.update({
      where: { id: car.id },
      data:  { computedLandedPrice: computed }
    });
  }
  console.log(`Updated successfully!`);
}

main().catch(console.error).finally(() => process.exit(0));
