async function run() {
  const { db } = require('./src/lib/db.js');
  const cars = await db.car.findMany();
  for (let c of cars) {
    if (c.dutyPaid === false) {
       // KRA mock estimate logic
       let base = c.price;
       let fobUSD = base / 135;
       let cifKES = base + (2750 * 135);
       
       let depreciation = 0;
       let age = new Date().getFullYear() - c.year;
       if (age === 1) depreciation = 0.10;
       else if (age === 2) depreciation = 0.20;
       else if (age === 3) depreciation = 0.30;
       else if (age === 4) depreciation = 0.40;
       else if (age === 5) depreciation = 0.50;
       else if (age === 6) depreciation = 0.60;
       else if (age >= 7) depreciation = 0.70;
       
       let currentVal = cifKES * (1 - depreciation);
       let duty = currentVal * 0.25;
       let exciseBase = currentVal + duty;
       let excise = exciseBase * 0.20;
       let vatBase = exciseBase + excise;
       let vat = vatBase * 0.16;
       let idf = currentVal * 0.035;
       let rdl = currentVal * 0.02;
       
       let total = cifKES + duty + excise + vat + idf + rdl;
       let final = Math.round(total + 200000);
       
       await db.car.update({ where: {id: c.id}, data: {computedLandedPrice: final }});
    } else {
       await db.car.update({ where: {id: c.id}, data: {computedLandedPrice: c.price }});
    }
  }
  console.log("Fixed DB!");
  process.exit(0);
}
run();
