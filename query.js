const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cars = await prisma.car.findMany({ select: { id: true, price: true, dutyPaid: true, fuelType: true, engineCC: true, year: true } });
  console.log(cars);
}
main().catch(console.error).finally(() => prisma.$disconnect());
