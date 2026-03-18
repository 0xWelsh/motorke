// src/app/api/dealers/route.js
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const dealers = await db.dealer.findMany({
    include: {
      _count: { select: { cars: { where: { available: true } } } },
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ dealers });
}
