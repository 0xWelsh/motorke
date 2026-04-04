import { db } from "./db";

const NEWS_API_KEY = process.env.NEWS_API_KEY;

/**
 * Fetches the latest automotive and car market news from NewsAPI.org
 * and stores them in the database, preventing duplicates by URL.
 */
export async function fetchAutomotiveNews() {
  if (!NEWS_API_KEY) {
    console.warn("NEWS_API_KEY not found in environment variables.");
    return [];
  }

  try {
    // Search for automotive, car market, and industry news
    const query = encodeURIComponent("automotive OR cars OR \"auto market\" OR \"car industry\"");
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=40&apiKey=${NEWS_API_KEY}`
    );
    
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to connect to NewsAPI");
    }

    const data = await res.json();

    if (data.status !== "ok") {
      throw new Error(data.message || "NewsAPI error");
    }

    // Filter out articles without mandatory information or images
    const articles = data.articles
      .filter((a) => a.title && a.url && a.urlToImage && a.title !== "[Removed]")
      .map((a) => ({
        title: a.title.trim(),
        description: a.description ? a.description.trim() : null,
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: new Date(a.publishedAt),
        sourceName: a.source.name,
      }));

    // Batch upsert to database
    // Using a loop here to handle individual upserts based on URL uniqueness
    const results = [];
    for (const article of articles) {
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

    console.log(`✓ Fetched and synchronized ${results.length} car news articles.`);
    return results;
  } catch (error) {
    console.error("Market Intelligence Fetch Error:", error);
    throw error;
  }
}
