const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cars = await prisma.car.findMany();
  console.log("Found:", cars.length);
  for (const c of cars) console.log(c.id, c.price, c.dutyPaid);
}
main().catch(console.error).finally(() => prisma.$disconnect());
