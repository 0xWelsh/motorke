const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Use eval to dynamically load utils.js because we can't use Next's ESM imports directly in a fast local script
  // Actually, I'll just write a script that queries the car, and then uses the API route to fetch it to see the UI response
  
  const c = await prisma.car.findUnique({ where: { id: "cmo2gkyyx0001uyj3q7gskl2j" } });
  
  // mock formatCarPrice
  const ageYears = new Date().getFullYear() - (c.year || 2019);
  const cifKes = (c.price || 0) + (2750 * 135);
  
  const dutyContent = fs.readFileSync('./src/lib/duty.js', 'utf8')
    .replace(/export const/g, 'const')
    .replace(/export function/g, 'function');
  eval(dutyContent);

  const breakdown = calculateDutyBreakdown({
      cifKes,
      ageYears,
      engineCC: c.engineCC || 1500,
      isElectric: c.fuelType === "ELECTRIC",
      rates: getDefaultDutyRates()
  });

  const landed = Math.round(breakdown.landed + 200000);
  console.log("DutyPaid:", c.dutyPaid);
  console.log("Price:", c.price);
  console.log("Calculated Landed Cost:", landed);

  // If dutyPaid is false, formatCarPrice should return landed.
  if (c.dutyPaid !== false) {
    console.log("formatCarPrice output:", c.price);
  } else {
    console.log("formatCarPrice output:", landed);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
