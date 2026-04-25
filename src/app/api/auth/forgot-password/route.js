export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/captcha";
import { NextResponse } from "next/server";
import { z } from "zod";

const FORGOT_WINDOW_MS = 10 * 60 * 1000;

const forgotSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  captchaToken: z.string().min(2),
  website: z.string().optional(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const { email, captchaToken, website } = parsed.data;
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

    if (website) {
      return NextResponse.json({
        success: true,
        message: "If an account exists for that email, a reset link has been sent.",
      });
    }

    const ipLimit = checkRateLimit({
      name: "forgot-password-ip",
      key: ip,
      windowMs: FORGOT_WINDOW_MS,
      maxRequests: 10,
    });
    if (ipLimit.limited) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
      );
    }

    const emailLimit = checkRateLimit({
      name: "forgot-password-email",
      key: email,
      windowMs: FORGOT_WINDOW_MS,
      maxRequests: 5,
    });
    if (emailLimit.limited) {
      return NextResponse.json({ error: "Too many reset attempts. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } });
    }
    const captchaCheck = await verifyTurnstileToken({ token: captchaToken, ip });
    if (!captchaCheck.success) {
      return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
      },
    });

    if (user?.active) {
      const resetToken = await createPasswordResetToken(email);
      await sendPasswordResetEmail({
        email,
        name: user.name,
        resetToken,
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
