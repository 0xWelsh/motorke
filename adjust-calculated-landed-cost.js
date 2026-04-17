const fs = require('fs');
let file = fs.readFileSync('src/lib/utils.js', 'utf8');

file = file.replace(
  /cifKes: Number\(price\) \|\| 0,/,
  `// By default, add standard Export ($450) and Shipping ($2300) = $2750 USD to the FOB price to estimate CIF.
    // Assuming 135 KES/USD for foreign cars.
    cifKes: (Number(price) || 0) + (2750 * 135),`
);

file = file.replace(
  /return Math\.round\(breakdown\.landed\);/,
  `// Include standard localized Clearing & Agent fees
  return Math.round(breakdown.landed + 200000);`
);

fs.writeFileSync('src/lib/utils.js', file, 'utf8');
