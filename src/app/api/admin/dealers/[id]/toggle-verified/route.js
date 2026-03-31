// src/app/api/admin/dealers/[id]/toggle-verified/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { id } = await params;
  const dealer = await db.dealer.findUnique({ where: { id } });
  if (!dealer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.dealer.update({ where: { id }, data: { verified: !dealer.verified } });
  return NextResponse.redirect(new URL("/admin/dealers", request.url));
}
