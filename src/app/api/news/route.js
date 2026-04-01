// src/app/api/news/route.js
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Fetch latest news */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const posts = await db.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Create news (Admin Only) */
export async function POST(request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content, tag, image, slug } = await request.json();
    
    const post = await db.post.create({
      data: {
        title:   title.trim(),
        content: content.trim(),
        tag:     tag.trim(),
        image:   image || null,
        slug:    slug || title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
      }
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
