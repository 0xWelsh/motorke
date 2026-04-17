const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('temp.html', 'utf8');
const $ = cheerio.load(html);

console.log($('table').length + ' tables found');
$('table').each((i, el) => {
    console.log("== Table " + i + " ==");
    console.log($(el).text().replace(/\s+/g, ' ').substring(0, 200) + '...');
});

