export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  type: z.enum(["BLOG", "COMPARISON", "LANDING"]),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(200),
  description: z.string().max(500).optional(),
  body: z.string().max(50000).optional(),
  meta: z.record(z.unknown()).optional(),
  publish: z.boolean().optional().default(false),
});

export async function GET() {
  await requireAdmin();
  try {
    const pages = await db.seoContentPage.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ pages });
  } catch (e) {
    return NextResponse.json({ error: e.message, pages: [] }, { status: 500 });
  }
}

export async function POST(request) {
  await requireAdmin();
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }

  const { type, slug, title, description, body, meta, publish } = parsed.data;
  const now = new Date();

  try {
    const page = await db.seoContentPage.create({
      data: {
        type,
        slug,
        title,
        description: description || null,
        body: body || null,
        meta: meta || null,
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? now : null,
      },
    });
    return NextResponse.json({ page }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
