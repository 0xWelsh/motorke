const fs = require('fs');
const content = fs.readFileSync('./src/lib/duty.js', 'utf8')
  .replace(/export const/g, 'const')
  .replace(/export function/g, 'function');
eval(content);

const price = 1012500;
const year = 2019;
let age = getAgeYearsFromYear(year);
console.log(calculateDutyBreakdown({
    cifKes: price,
    ageYears: age,
    engineCC: 1500,
    isElectric: false,
    rates: getDefaultDutyRates()
}))
