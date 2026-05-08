export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { createEmailOTP, sendVerificationEmail } from "@/lib/mail";
import { getClientIp, json429, normalizeEmail } from "@/lib/request-security";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);
    const safeEmail = parsed.success ? normalizeEmail(parsed.data.email) : null;

    if (!safeEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const ip = getClientIp(request);

    const ipLimit = checkRateLimit({
      name: "resend-otp-ip",
      key: ip,
      windowMs: 10 * 60 * 1000,
      maxRequests: 20,
    });
    if (ipLimit.limited) {
      return json429("Too many requests. Please try again shortly.", ipLimit.retryAfter);
    }

    const emailLimit = checkRateLimit({
      name: "resend-otp-email",
      key: safeEmail,
      windowMs: 10 * 60 * 1000,
      maxRequests: 5,
    });
    if (emailLimit.limited) {
      return json429("Too many attempts for this email. Please try again shortly.", emailLimit.retryAfter);
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
