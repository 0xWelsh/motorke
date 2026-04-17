const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const c = await prisma.car.findMany({ select: { computedLandedPrice: true, price: true, dutyPaid: true }, take: 5 });
  console.log(c);
  process.exit();
}
run();
