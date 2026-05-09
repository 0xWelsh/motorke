import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request, { params }) {
  await requireAdmin();
  const { id } = await params;
  const existing = await db.carReview.findUnique({
    where: { id },
    select: { carId: true },
  });
  await db.carReview.delete({ where: { id } });
  if (existing?.carId) {
    revalidateTag(`car-reviews:${existing.carId}`);
  }
  return NextResponse.redirect(new URL("/admin/reviews", request.url));
}
