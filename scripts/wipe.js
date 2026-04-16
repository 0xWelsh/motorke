const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Wiping...");
  await prisma.car.deleteMany({});
  await prisma.dealerBranch.deleteMany({});
  await prisma.dealer.deleteMany({});
  const deletedUsers = await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
  console.log(`Deleted ${deletedUsers.count} non-ADMIN users.`);
  console.log("Done.");
}
main().finally(() => prisma.$disconnect());
