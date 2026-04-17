const fs = require('fs');
const content = fs.readFileSync('./src/lib/duty.js', 'utf8')
  .replace(/export const/g, 'const')
  .replace(/export function/g, 'function');
eval(content);

const cifKes = 1012500 + (2750 * 135);
const ageYears = getAgeYearsFromYear(2019);

const breakdown = calculateDutyBreakdown({
    cifKes,
    ageYears,
    engineCC: 1500,
    isElectric: false,
    rates: getDefaultDutyRates()
});

console.log(breakdown.landed + 200000);
