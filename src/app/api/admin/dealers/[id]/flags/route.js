// src/app/api/admin/dealers/[id]/flags/route.js
// Admin-only partial update for a dealer's curation flags. Lets the
// dealer-list page toggle `verified` and `featured` inline without
// reposting every other field through the big edit form.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

const ALLOWED_FLAGS = new Set(["verified", "featured"]);

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const flag = body?.flag;
  if (!flag || !ALLOWED_FLAGS.has(flag)) {
    return NextResponse.json({ error: "Unknown flag" }, { status: 400 });
  }

  const value = Boolean(body?.value);

  try {
    const updated = await db.dealer.update({
      where: { id },
      data: { [flag]: value },
      select: { id: true, verified: true, featured: true, name: true },
    });
    return NextResponse.json({ ok: true, dealer: updated });
  } catch (err) {
    console.error("dealer flags update failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
