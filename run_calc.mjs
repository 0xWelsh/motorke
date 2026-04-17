import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
import { estimateLandedCost } from './src/lib/utils.js';

async function run() {
  const cars = await db.car.findMany();
  let count = 0;
  for(const c of cars) {
      if(c.dutyPaid === false) {
          const proxyRates = {
             duty_rate: 0.25,
             excise_rate: 0.20,
             vat_rate: 0.16,
             idf_rate: 0.035,
             rdl_rate: 0.02
          };
          const landed = estimateLandedCost(c.price, c.year, { engineCC: c.engineCC || 1500, isElectric: c.fuelType === "ELECTRIC", rates: proxyRates });
          await db.car.update({where: {id:c.id}, data: {computedLandedPrice: landed}});
      } else {
          await db.car.update({where: {id:c.id}, data: {computedLandedPrice: c.price}});
      }
      count++;
  }
  console.log("Updated", count);
  process.exit(0);
}
run();
