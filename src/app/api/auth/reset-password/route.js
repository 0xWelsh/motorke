export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/captcha";
import { NextResponse } from "next/server";
import { z } from "zod";

const RESET_WINDOW_MS = 10 * 60 * 1000;

const resetSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    token: z.string().min(10),
    password: z.string().min(8),
    confirm: z.string().min(8),
    captchaToken: z.string().min(2),
    website: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
    }

    const { email, token, password, captchaToken, website } = parsed.data;
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

    if (website) {
      return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
    }

    const ipLimit = checkRateLimit({
      name: "reset-password-ip",
      key: ip,
      windowMs: RESET_WINDOW_MS,
      maxRequests: 12,
    });
    if (ipLimit.limited) {
      return NextResponse.json({ error: "Too many reset attempts. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } });
    }
    const tokenLimit = checkRateLimit({
      name: "reset-password-token",
      key: `${email}:${token}`,
      windowMs: RESET_WINDOW_MS,
      maxRequests: 5,
    });
    if (tokenLimit.limited) {
      return NextResponse.json({ error: "Too many reset attempts. Please request a new reset link." }, { status: 429, headers: { "Retry-After": String(tokenLimit.retryAfter) } });
    }
    const captchaCheck = await verifyTurnstileToken({ token: captchaToken, ip });
    if (!captchaCheck.success) {
      return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
    }

    const identifier = `reset:${email}`;

    const storedToken = await db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    });

    if (!storedToken) {
      return NextResponse.json({ error: "Reset link is invalid or already used." }, { status: 400 });
    }

    if (storedToken.expires < new Date()) {
      await db.verificationToken.deleteMany({ where: { identifier } });
      return NextResponse.json({ error: "Reset link has expired." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      await db.verificationToken.deleteMany({ where: { identifier } });
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const passwordHash = await hashPassword(password);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      db.verificationToken.deleteMany({ where: { identifier } }),
      db.session.deleteMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password reset successful. Please sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
