const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.carModelSpec.updateMany({
    data: { published: true }
  });
  console.log(`Successfully updated ${result.count} specs to published: true`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
