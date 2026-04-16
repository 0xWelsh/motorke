const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // we have bcrypt installed natively originally
const prisma = new PrismaClient();

async function sync() {
  const dealers = await prisma.dealer.findMany({ include: { users: true } });
  
  for (const dealer of dealers) {
    if (dealer.users.length === 0 && dealer.email) {
      console.log(`Syncing user for dealer: ${dealer.name} (${dealer.email})`);
      const defaultPasswordHash = await bcrypt.hash("Motorke123!", 10);
      
      const existingUser = await prisma.user.findUnique({ where: { email: dealer.email } });
      if (!existingUser) {
        await prisma.user.create({
           data: {
             email: dealer.email,
             passwordHash: defaultPasswordHash,
             name: dealer.name,
             role: "DEALER",
             dealerId: dealer.id,
             active: true
           }
        });
        console.log(`Created new user for ${dealer.email}`);
      } else {
        await prisma.user.update({
           where: { id: existingUser.id },
           data: { dealerId: dealer.id, role: "DEALER" }
        });
        console.log(`Linked existing user ${dealer.email} to dealer`);
      }
    }
  }
}

sync().then(() => console.log('Done')).catch(console.error);
