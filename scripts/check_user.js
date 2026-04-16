const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ where: { email: 'sec@welsh.co.ke' } });
  console.log(JSON.stringify(users, null, 2));
}
check();
