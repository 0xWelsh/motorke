export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { createEmailOTP, sendVerificationEmail } from "@/lib/mail";

export async function POST(request) {
  try {
    const { email } = await request.json();
    const safeEmail = (email || "").toString().toLowerCase().trim();

    if (!safeEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

    const ipLimit = checkRateLimit({
      name: "resend-otp-ip",
      key: ip,
      windowMs: 10 * 60 * 1000,
      maxRequests: 20,
    });
    if (ipLimit.limited) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${ipLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    const emailLimit = checkRateLimit({
      name: "resend-otp-email",
      key: safeEmail,
      windowMs: 10 * 60 * 1000,
      maxRequests: 5,
    });
    if (emailLimit.limited) {
      return NextResponse.json(
        { error: `Too many attempts for this email. Try again in ${emailLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: safeEmail },
      select: { id: true, name: true, emailVerified: true },
    });

    // Keep response generic to avoid account enumeration.
    if (!user || user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "If this account exists and is pending verification, a new code has been sent.",
      });
    }

    const otp = await createEmailOTP(safeEmail);
    const sent = await sendVerificationEmail(safeEmail, user.name || "there", otp);
    if (!sent?.success) {
      return NextResponse.json(
        { error: "We couldn't send a new code right now. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A new verification code has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Failed to resend verification code." }, { status: 500 });
  }
}
