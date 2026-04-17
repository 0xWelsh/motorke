const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('temp.html', 'utf8');
const $ = cheerio.load(html);

// Find all scripts to see if rates are in a script
let found = false;
$('script').each((i, el) => {
    const text = $(el).html();
    if (text && (text.includes('vat') || text.includes('excise') || text.includes('idf'))) {
        console.log("== Script " + i + " ==");
        console.log(text.substring(0, 200) + '...');
        found = true;
    }
});

