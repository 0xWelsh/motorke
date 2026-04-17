const fs = require('fs');
const path = require('path');

const IMPORT_STMT = `import { computeLandedPriceForDb } from "@/lib/duty";\n`;

function patchFile(filepath) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Add import if not present
    if (!content.includes('computeLandedPriceForDb')) {
        content = `${IMPORT_STMT}${content}`;
    }
    
    // Replace price: X with price: X, computedLandedPrice: await computeLandedPriceForDb(...)
    // Looking for a pattern like:  price: parseInt(price),  (or Number, etc)
    const regex = /price:\s*(.*?)(,)/g;
    
    content = content.replace(regex, (match, p1, p2) => {
        // Only patch if we haven't already
        if (content.includes('computedLandedPrice:')) return match; 
        
        let p = p1.trim();
        // create the line
        return `price: ${p},\n      computedLandedPrice: await computeLandedPriceForDb(${p}, dutyPaid, year, engineCC, fuelType)${p2}`;
    });

    // Special cases where variables might be something else:
    // Need to make sure dutyPaid, year, engineCC, fuelType are available in scope!
    fs.writeFileSync(filepath, content, 'utf8');
}

const files = [
    'src/app/api/portal/cars/route.js',
    'src/app/api/portal/cars/[id]/route.js',
    'src/app/api/admin/cars/route.js',
    'src/app/api/admin/cars/[id]/route.js',
    'src/app/api/cars/create/route.js'
];

for (const f of files) {
    patchFile(f);
}
console.log("Patched");
