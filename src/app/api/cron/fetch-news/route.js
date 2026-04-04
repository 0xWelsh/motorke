import { fetchAutomotiveNews } from "@/lib/news";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Cron-style endpoint to fetch and synchronize car news daily.
 * Can be triggered manually or by an automated cron service (e.g. Vercel Cron).
 */
export async function GET(request) {
  // Check for CRON_SECRET if defined to protect the route
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized - Invalid or missing CRON_SECRET', { status: 401 });
  }

  try {
    const articles = await fetchAutomotiveNews();
    return NextResponse.json({ 
      success: true, 
      count: articles.length,
      message: `Synchronized ${articles.length} automotive news articles successfully.` 
    });
  } catch (error) {
    console.error("Cron Fetch Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Unknown error during fetch operation" 
    }, { status: 500 });
  }
}
