const fs = require('fs');

const files = [
  "src/components/SpecSheet.js",
  "src/components/DealerInventory.js",
  "src/components/ClientRecentSection.js",
  "src/app/cars/[id]/page.js",
  "src/app/admin/cars/page.js",
  "src/app/portal/inventory/page.js",
  "src/app/portal/analytics/page.js",
  "src/app/portal/page.js",
  "src/app/page.js",
  "src/app/compare/CompareClient.js"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace formatPrice(...) with formatCarPrice(...)
  content = content.replace(/formatPrice\(car\.price\)/g, "formatCarPrice(car)");
  content = content.replace(/formatPrice\(c\.price\)/g, "formatCarPrice(c)");
  content = content.replace(/formatPrice\(c\?\.price\)/g, "formatCarPrice(c)");

  // Import formatCarPrice if it's not already imported
  if (!content.includes('formatCarPrice') && (content.includes('formatPrice(car.price)') || content.includes('formatCarPrice'))) {
     continue; // just logic check, we know it has formatCarPrice now
  }
  
  if (content.includes('formatCarPrice')) {
      content = content.replace(/import \{([^}]+)formatPrice([^}]+)\} from "@\/lib\/utils";/, (match, p1, p2) => {
        if (!match.includes('formatCarPrice')) {
          return `import {${p1}formatPrice, formatCarPrice${p2}} from "@/lib/utils";`;
        }
        return match;
      });
  }

  // Double check some edge cases:
  // "import { formatPrice } from" -> "import { formatPrice, formatCarPrice } from"
  if (!content.includes('formatCarPrice') || (content.includes('formatCarPrice') && !content.match(/import\s+{.*formatCarPrice.*}/))) {
      content = content.replace(/import {(\s*)formatPrice(\s*)(,?)([^}]*)} from "@\/lib\/utils";/, "import {$1formatPrice, formatCarPrice$2$3$4} from \"@/lib/utils\";");
  }

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Done");
