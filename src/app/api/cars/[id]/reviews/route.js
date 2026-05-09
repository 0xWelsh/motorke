// src/app/api/cars/[id]/reviews/route.js
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { revalidateTag } from "next/cache";

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
      console.error("Car review POST: No session found");
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const { id: carId } = params;
    
    if (!carId) {
      console.error("Car review POST: No carId found");
      return NextResponse.json({ error: "Invalid car ID" }, { status: 400 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      console.error("Car review POST: Invalid rating", { rating });
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    console.log("Creating car review:", { carId, userId: session.user.id, rating });

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

    // Car detail uses unstable_cache with tag `car-reviews:${carId}`.
    // Invalidate right after write so router.refresh() can show the new review immediately.
    revalidateTag(`car-reviews:${carId}`);

    console.log("Review created successfully:", review.id);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Failed to create car review:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create review" },
      { status: 500 }
    );
  }
}