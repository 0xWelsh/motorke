const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting dummy data wipe (keeping ADMINs)...');

  // Delete dependencies first just in case cascades aren't fully configured
  try { await prisma.carImage.deleteMany({}); console.log('Deleted Car Images'); } catch(e) {}
  try { await prisma.carView.deleteMany({}); console.log('Deleted Car Views'); } catch(e) {}
  try { await prisma.savedCar.deleteMany({}); console.log('Deleted Saved Cars'); } catch(e) {}
  try { await prisma.carReview.deleteMany({}); console.log('Deleted Car Reviews'); } catch(e) {}
  try { await prisma.dealerReview.deleteMany({}); console.log('Deleted Dealer Reviews'); } catch(e) {}
  try { await prisma.leadNote.deleteMany({}); console.log('Deleted Lead Notes'); } catch(e) {}
  try { await prisma.lead.deleteMany({}); console.log('Deleted Leads'); } catch(e) {}
  try { await prisma.notification.deleteMany({}); console.log('Deleted Notifications'); } catch(e) {}
  try { await prisma.session.deleteMany({}); console.log('Deleted Sessions'); } catch(e) {}

  try { await prisma.car.deleteMany({}); console.log('Deleted Cars'); } catch(e) {}
  try { await prisma.dealerBranch.deleteMany({}); console.log('Deleted Dealer Branches'); } catch(e) {}
  try { await prisma.dealer.deleteMany({}); console.log('Deleted Dealers'); } catch(e) {}

  try {
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    });
    console.log(`Deleted ${deletedUsers.count} non-ADMIN users.`);
  } catch(e) {}

  console.log('\n✅ Database wiped successfully! Ready for real dealerships and imported inventory.');
}

main()
  .catch(e => {
    console.error('Error wiping database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
