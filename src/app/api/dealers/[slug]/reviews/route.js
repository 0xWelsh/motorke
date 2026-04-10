export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export async function GET(request, { params }) {
  const { slug } = await params;

  const dealer = await db.dealer.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  const [stats, reviews] = await Promise.all([
    db.dealerReview.aggregate({
      where: { dealerId: dealer.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    db.dealerReview.findMany({
      where: { dealerId: dealer.id },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    averageRating: Number(stats._avg.rating || 0),
    totalReviews: stats._count._all,
    reviews,
  });
}

export async function POST(request, { params }) {
  const { slug } = await params;
  const session = await getSessionFromRequest();

  if (!session) {
    return NextResponse.json({ error: "Please log in to post a review" }, { status: 401 });
  }

  const parsed = createReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review data" }, { status: 400 });
  }

  const dealer = await db.dealer.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  if (session.user.role === "DEALER" && session.user.dealerId === dealer.id) {
    return NextResponse.json({ error: "You cannot review your own dealership" }, { status: 403 });
  }

  const { rating, comment } = parsed.data;

  const review = await db.dealerReview.upsert({
    where: {
      dealerId_userId: {
        dealerId: dealer.id,
        userId: session.user.id,
      },
    },
    update: {
      rating,
      comment: comment?.trim() || null,
    },
    create: {
      dealerId: dealer.id,
      userId: session.user.id,
      rating,
      comment: comment?.trim() || null,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ success: true, review });
}
