// src/app/api/cars/[id]/reviews/route.js
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request, props) {
  try {
    const params = await props.params;
    const { id: carId } = params;
    const reviews = await db.carReview.findMany({
      where: { carId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

    return NextResponse.json({
      reviews,
      avgRating,
      count: reviews.length,
    });
  } catch (error) {
    console.error("Failed to fetch car reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request, props) {
  try {
    const params = await props.params;
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: carId } = params;
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = await db.carReview.upsert({
      where: {
        carId_userId: {
          carId,
          userId: session.user.id,
        },
      },
      update: {
        rating,
        comment: comment?.trim() || null,
      },
      create: {
        carId,
        userId: session.user.id,
        rating,
        comment: comment?.trim() || null,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Failed to create car review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}