// scripts/create-admin.js
// Creates an admin user so you can access /admin.
//
// Usage: node scripts/create-admin.js
//        node scripts/create-admin.js --email admin@example.com --name "Admin Name"

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const email = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1]
    || process.env.ADMIN_EMAIL
    || "admin@welshmotorhub.co.ke";

  const name = process.argv.find((a) => a.startsWith("--name="))?.split("=")[1]
    || process.env.ADMIN_NAME
    || "Admin";

  console.log("");
  console.log(`  Creating admin: ${name} <${email}>`);
  console.log("");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "ADMIN") {
      console.log("  ✓  Admin already exists with this email.");
    } else {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      console.log("  ✓  User promoted to ADMIN.");
    }
    return;
  }

  const password = process.argv.find((a) => a.startsWith("--password="))?.split("=")[1]
    || (await ask("  Password: "));
  if (!password || password.length < 6) {
    console.log("  Password must be at least 6 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN", active: true, emailVerified: new Date() },
  });

  console.log(`  ✓  Admin created. Sign in at /login with ${email}`);
  console.log("");
}

function ask(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once("data", (data) => resolve(data.toString().trim()));
  });
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
