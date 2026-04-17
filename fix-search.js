const fs = require('fs');

let apiFile = fs.readFileSync('src/app/api/cars/search/route.js', 'utf8');
apiFile = apiFile.replace(/price: car\.price,/, 'price: car.price, dutyPaid: car.dutyPaid, engineCC: car.engineCC, fuelType: car.fuelType,');
fs.writeFileSync('src/app/api/cars/search/route.js', apiFile, 'utf8');

let searchSug = fs.readFileSync('src/components/SearchSuggestions.js', 'utf8');
searchSug = searchSug.replace(/KSh {car\.price\?\.toLocaleString\(\) \|\| "—"}/, '{formatCarPrice(car)}');
searchSug = searchSug.replace(/import {([^}]+)} from "lucide-react";/, 'import {$1} from "lucide-react";\nimport { formatCarPrice } from "@/lib/utils";');
fs.writeFileSync('src/components/SearchSuggestions.js', searchSug, 'utf8');

let accountTabs = fs.readFileSync('src/components/AccountTabs.js', 'utf8');
accountTabs = accountTabs.replace(/const fmt = \(n\) => "KSh " \+ Number\(n\)\.toLocaleString\("en-KE"\);/g, '');
accountTabs = accountTabs.replace(/fmt\(car\.price\)/g, 'formatCarPrice(car)');
accountTabs = accountTabs.replace(/import {([^}]+)} from "lucide-react";/, 'import {$1} from "lucide-react";\nimport { formatCarPrice } from "@/lib/utils";');
fs.writeFileSync('src/components/AccountTabs.js', accountTabs, 'utf8');

let bulkFile = fs.readFileSync('src/components/BulkUpload.js', 'utf8');
bulkFile = bulkFile.replace(/{row\.price \? "KSh " \+ Number\(row\.price\)\.toLocaleString\(\) : "—"}/g, '{row.price ? formatCarPrice(row) : "—"}');
if(!bulkFile.includes('formatCarPrice')) {
    bulkFile = bulkFile.replace(/import {([^}]+)} from "@\/lib\/utils";/, 'import {$1, formatCarPrice} from "@/lib/utils";');
}
fs.writeFileSync('src/components/BulkUpload.js', bulkFile, 'utf8');

