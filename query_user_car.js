const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.car.findUnique({ where: { id: "cmo2gkyyx0001uyj3q7gskl2j" } });
  console.log(c.id, c.price, c.dutyPaid);
}
main().catch(console.error).finally(() => prisma.$disconnect());
