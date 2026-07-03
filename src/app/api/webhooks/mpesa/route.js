export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";

const SAFARICOM_CALLBACK_IPS = [
  "196.201.214.200", "196.201.214.201", "196.201.213.200", "196.201.213.201",
  "196.201.214.206", "196.201.214.207", "196.201.213.206", "196.201.213.207",
  "196.201.214.44", "196.201.212.74", "196.201.212.76", "196.201.212.78",
  "196.201.212.80", "196.201.214.48", "196.201.214.50", "196.201.212.126",
  "196.201.212.128", "196.201.212.130", "196.201.212.132",
];

async function validateWebhookPayload(payload, signature, request) {
  // 1. Validate payload structure
  if (!payload?.Body?.stkCallback) {
    return { valid: false, error: "Invalid payload structure" };
  }

  // 2. IP allowlist check — reject if source IP is not a known Safaricom IP
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  if (process.env.NODE_ENV === "production" && !SAFARICOM_CALLBACK_IPS.includes(clientIp)) {
    console.warn(`Webhook rejected — unknown source IP: ${clientIp}`);
    return { valid: false, error: "Untrusted source IP" };
  }

  // 3. Require HMAC signature validation when MPESA_WEBHOOK_SECRET is set
  if (process.env.MPESA_WEBHOOK_SECRET) {
    if (!signature) {
      return { valid: false, error: "Missing webhook signature" };
    }
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac("sha256", process.env.MPESA_WEBHOOK_SECRET)
      .update(payloadString)
      .digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid signature" };
    }
  }

  // 4. Validate required fields in callback
  const { CheckoutRequestID, ResultCode, ResultDesc } = payload.Body.stkCallback;
  if (!CheckoutRequestID || ResultCode === undefined || !ResultDesc) {
    return { valid: false, error: "Missing required callback fields" };
  }

  return { valid: true };
}

export async function POST(request) {
  try {
    // Extract signature from headers
    const signature = request.headers.get("x-daraja-signature");

    const payload = await request.json();

    // Validate payload before processing
    const validation = await validateWebhookPayload(payload, signature, request);
    if (!validation.valid) {
      console.warn(`Webhook validation failed: ${validation.error}`);
      // Return 200 OK anyway as Safaricom requires, but don't process
      return NextResponse.json({ success: true });
    }

    // The STK Push payload is wrapped in `Body.stkCallback`
    const stkCallback = payload?.Body?.stkCallback;

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      stkCallback;

    // 1. Locate the Pending Payment we created during initialization
    const payment = await db.payment.findFirst({
      where: { reference: CheckoutRequestID, method: "MPESA" },
      include: { subscription: true },
    });

    if (!payment) {
      console.error(
        `Daraja Webhook: No mapping Payment found for CheckoutRequestID: ${CheckoutRequestID}`
      );
      return NextResponse.json({ success: true }); // Safaricom requires a 200 OK regardless
    }

    // 2. Handle Failed/Cancelled Transactions
    if (ResultCode !== 0) {
      console.log(`M-Pesa Transaction Failed [${CheckoutRequestID}]: ${ResultDesc}`);
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" }
      });
      return NextResponse.json({ success: true });
    }

    // 3. Extract MetaData for Successful Transactions
    const metaItems = CallbackMetadata?.Item || [];
    let receiptNumber = null;
    let paidAmount = 0;

    metaItems.forEach((item) => {
      if (item.Name === "MpesaReceiptNumber") receiptNumber = item.Value;
      if (item.Name === "Amount") paidAmount = item.Value;
    });

    // 4. Update the Payment & Subscription Status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        reference: receiptNumber || CheckoutRequestID, // Store the final M-Pesa receipt alphanumeric code
      }
    });

    // Calculate next billing date (assume 30 days for this logic block)
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    await db.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: "ACTIVE",
        mpesaRef: receiptNumber,
        endDate: nextMonth
      }
    });

    // Successfully logged and activated!
    console.log(`✅ Automated Daraja Payment Successful! Receipt: ${receiptNumber}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 }); // Retry later if Safaricom drops
  }
}
