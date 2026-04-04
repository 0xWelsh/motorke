const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure'],
    ],
  },
});
(async () => {
  try {
    const feed = await parser.parseURL('https://www.motor1.com/rss/news/all/');
    console.log(JSON.stringify(feed.items[0], null, 2));
  } catch (e) {
    console.error(e);
  }
})();
