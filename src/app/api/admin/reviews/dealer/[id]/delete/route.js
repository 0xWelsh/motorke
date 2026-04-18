import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request, { params }) {
  await requireAdmin();
  const { id } = await params;
  await db.dealerReview.delete({ where: { id } });
  revalidateTag("dealer-reviews");
  return NextResponse.redirect(new URL("/admin/reviews", request.url));
}
