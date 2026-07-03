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
      include: { subscription: true },
    });

    if (!payment) {
      return NextResponse.json({ status: "PENDING" });
    }

    // Only the dealer who owns the subscription or an admin can check this payment
    const isOwner = session.user.dealerId
      && payment.subscription.dealerId === session.user.dealerId;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ status: payment.status });

  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 });
  }
}
