import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const total = await db.car.count();
    return NextResponse.json({
      success: true,
      message: "Recalculation is no longer required; listed prices are treated as final.",
      total,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
