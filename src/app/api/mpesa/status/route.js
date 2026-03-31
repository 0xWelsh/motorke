export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get("id");

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "Missing checkout request ID" }, { status: 400 });
    }

    const payment = await db.payment.findFirst({
      where: { reference: checkoutRequestId, method: "MPESA" },
    });

    if (!payment) {
      return NextResponse.json({ status: "PENDING" });
    }

    return NextResponse.json({ status: payment.status });

  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 });
  }
}
