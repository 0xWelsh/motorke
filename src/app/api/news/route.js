import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Public API to retrieve the latest car news for the Market Intelligence dashboard.
 */
export async function GET() {
  try {
    const articles = await db.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50, // Limit to recent pulse of the market
    });
    
    return NextResponse.json(articles);
  } catch (error) {
    console.error("Public News API Error:", error);
    return NextResponse.json({ 
      error: "Failed to retrieve market intelligence articles" 
    }, { status: 500 });
  }
}
