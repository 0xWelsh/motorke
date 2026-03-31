// src/app/api/saved/[carId]/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST — save a car
export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    await db.savedCar.create({
      data: { userId: session.userId, carId: id },
    });
    return NextResponse.json({ saved: true });
  } catch {
    // Already saved — ignore unique constraint error
    return NextResponse.json({ saved: true });
  }
}

// DELETE — unsave a car
export async function DELETE(request, { params }) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  await db.savedCar.deleteMany({
    where: { userId: session.userId, carId: id },
  });

  return NextResponse.json({ saved: false });
}

// GET — check if car is saved
export async function GET(request, { params }) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ saved: false });

  const existing = await db.savedCar.findUnique({
    where: { userId_carId: { userId: session.userId, carId: id } },
  });

  return NextResponse.json({ saved: !!existing });
}
