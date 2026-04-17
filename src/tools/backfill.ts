import { db } from "../lib/db";
import { computeLandedPriceForDb } from "../lib/duty";

async function main() {
  const cars = await db.car.findMany({ select: { id: true, price: true, dutyPaid: true, year: true, engineCC: true, fuelType: true } });
  console.log(`Found ${cars.length} cars.`);
  
  let count = 0;
  for (const car of cars) {
    const computed = await computeLandedPriceForDb(car.price, car.dutyPaid, car.year, car.engineCC, car.fuelType);
    await db.car.update({
      where: { id: car.id },
      data:  { computedLandedPrice: computed }
    });
    count++;
  }
  console.log(`Updated successfully ${count} cars!`);
}

main().catch(console.error).finally(() => process.exit(0));
