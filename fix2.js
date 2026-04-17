const fs = require('fs');

const files = [
  "src/app/cars/[id]/page.js",
  "src/app/compare/CompareClient.js"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.split('formatPrice(car.price)').join('formatCarPrice(car)');
  content = content.split('formatPrice(c.price)').join('formatCarPrice(c)');
  content = content.split('formatPrice(c?.price)').join('formatCarPrice(c)');
  content = content.split('formatPrice(res.price)').join('formatCarPrice(res)');
  content = content.split('formatPrice(winnerByPrice.price)').join('formatCarPrice(winnerByPrice)');
  content = content.split('formatPrice(car.price || 0)').join('formatCarPrice(car)');

  if (!content.includes('formatCarPrice') && content.includes('formatPrice')) {
     continue;
  }
  
  // Add formatCarPrice to imports manually avoiding catastrophic replace bugs
  if (content.includes('formatPrice, formatMileage')) {
     content = content.split('formatPrice, formatMileage').join('formatPrice, formatCarPrice, formatMileage');
  } else if (content.includes('formatPrice,')) {
     content = content.split('formatPrice,').join('formatPrice, formatCarPrice,');
  }
  
  // Cleanup any potential duplicates
  content = content.split('formatCarPrice, formatCarPrice,').join('formatCarPrice,');

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Done");
