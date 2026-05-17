export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(500).optional(),
  body: z.string().max(50000).optional(),
});

export async function PATCH(request, { params }) {
  await requireAdmin();
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.status === "PUBLISHED") {
    data.publishedAt = new Date();
  }

  try {
    const page = await db.seoContentPage.update({ where: { id }, data });
    return NextResponse.json({ page });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}
