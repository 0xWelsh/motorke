const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const car = await prisma.car.findFirst();
    console.log('Successfully fetched a car:', !!car);
    if (car) {
      console.log('Car columns:', Object.keys(car));
    }
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
