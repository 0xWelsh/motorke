const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const promise = new Promise((resolve) => resolve("test"));
    await prisma.user.update({
      where: { id: "123" },
      data: { passwordHash: promise }
    });
  } catch (err) {
    console.error(err.message);
  }
}
main();
