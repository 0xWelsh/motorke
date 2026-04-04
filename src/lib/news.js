import { db } from "./db";
import Parser from "rss-parser";

/**
 * Fetches the latest automotive and car market news via public RSS feeds
 * and stores them in the database, preventing duplicates by URL.
 */
export async function fetchAutomotiveNews() {
  try {
    const parser = new Parser({
      customFields: {
        item: [
          ["media:content", "mediaContent"],
          ["enclosure", "enclosure"],
        ],
      },
    });
    
    // Popular automotive news RSS feed
    const feed = await parser.parseURL("https://www.motor1.com/rss/news/all/");
    
    // Filter and format items
    const articles = feed.items.map(item => {
      // Extract image
      let img = null;
      if (item.enclosure && item.enclosure.url) {
        img = item.enclosure.url;
      } else if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
        img = item.mediaContent.$.url;
      }
      
      // Fallback premium car image if RSS doesn't provide one
      if (!img) {
         img = "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80";
      }

      // Safe substring for snippets
      let cleanDesc = item.contentSnippet ? item.contentSnippet.trim() : "";
      if (cleanDesc.length > 200) {
          cleanDesc = cleanDesc.substring(0, 197) + "...";
      }

      return {
        title: item.title?.trim() || "Automotive Update",
        description: cleanDesc || null,
        url: item.link,
        urlToImage: img,
        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        sourceName: feed.title || "Motor1 News",
      };
    }).slice(0, 15); // Take the 15 most recent

    const results = [];
    for (const article of articles) {
      if (!article.url) continue;
      try {
        const saved = await db.article.upsert({
          where: { url: article.url },
          update: {
            title: article.title,
            description: article.description,
            urlToImage: article.urlToImage,
            publishedAt: article.publishedAt,
            sourceName: article.sourceName,
          },
          create: article,
        });
        results.push(saved);
      } catch (dbError) {
        console.error(`Error saving article ${article.url}:`, dbError);
      }
    }

    console.log(`✓ Fetched and synchronized ${results.length} RSS car news articles.`);
    return results;
  } catch (error) {
    console.error("Market Intelligence Fetch Error:", error);
    throw error;
  }
}
