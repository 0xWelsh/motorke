import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { id }     = await params;
  const { action } = await req.json(); // "whatsapp" or "print"

  try {
    if (action === "whatsapp") {
      await db.car.update({
        where: { id },
        data: { whatsappClicks: { increment: 1 } },
      });
    } else if (action === "print") {
      await db.car.update({
        where: { id },
        data: { printCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
