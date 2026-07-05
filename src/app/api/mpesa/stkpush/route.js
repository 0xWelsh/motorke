export const dynamic = "force-dynamic";
import { initiateSTKPush } from "@/lib/mpesa";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { dealer: true }
    });

    if (!user || user.role !== "DEALER" || !user.dealerId) {
      return NextResponse.json({ error: "Only verified dealerships can subscribe." }, { status: 403 });
    }

    const { phone, plan } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Please provide an M-Pesa phone number." }, { status: 400 });
    }

    // Determine pricing based on requested plan
    const pricing = { PRO: 2000, ENTERPRISE: 10000 };
    const amount = pricing[plan];
    
    if (!amount) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }
    
    // Send STK Push to the user's phone
    const stkResponse = await initiateSTKPush(
      phone,
      amount,
      user.dealerId, // AccountReference
      `BIDGARI ${plan} Subscription` // TransactionDesc
    );

    // Ensure the Dealer has a Subscription track
    let subscription = await db.subscription.findUnique({ where: { dealerId: user.dealerId } });
    if (!subscription) {
       subscription = await db.subscription.create({
          data: { dealerId: user.dealerId, plan: plan === "PRO_ANNUAL" ? "PRO" : "PRO", status: "TRIAL" }
       });
    }

    // Register a Pending Payment linked to the CheckoutRequestID!
    await db.payment.create({
       data: {
         subscriptionId: subscription.id,
         amount: amount,
         method: "MPESA",
         reference: stkResponse.CheckoutRequestID,
         status: "PENDING"
       }
    });

    // stkResponse contains CheckoutRequestID which is needed to track the transaction
    return NextResponse.json({ 
      success: true, 
      checkoutRequestId: stkResponse.CheckoutRequestID,
      message: "Success! Please check your phone for the M-Pesa PIN prompt."
    });

  } catch (error) {
    console.error("M-Pesa API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate M-Pesa transaction." }, { status: 500 });
  }
}
