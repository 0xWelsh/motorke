export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { isCaptchaConfigured, verifyTurnstileToken } from "@/lib/captcha";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(128),
  captchaToken: z.string().max(2048).optional(),
  website: z.string().max(0).optional(),
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const rawData = Object.fromEntries(formData.entries());
    const parsed = loginSchema.safeParse(rawData);

    if (!parsed.success) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    const { email, password, captchaToken, website } = parsed.data;
    if (website) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    const ip = getClientIp(request);

    const ipLimit = checkRateLimit({
      name: "login-ip",
      key: ip,
      windowMs: 10 * 60 * 1000,
      maxRequests: 20,
    });
    if (ipLimit.limited) {
      return NextResponse.redirect(new URL("/login?error=too_many", request.url));
    }

    const emailLimit = checkRateLimit({
      name: "login-email",
      key: email,
      windowMs: 10 * 60 * 1000,
      maxRequests: 10,
    });
    if (emailLimit.limited) {
      return NextResponse.redirect(new URL("/login?error=too_many", request.url));
    }

    if (isCaptchaConfigured()) {
      const captchaCheck = await verifyTurnstileToken({ token: captchaToken, ip });
      if (!captchaCheck.success) {
        return NextResponse.redirect(new URL("/login?error=captcha", request.url));
      }
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    if (!user.active) {
      return NextResponse.redirect(new URL("/login?error=inactive", request.url));
    }

    if (!user.emailVerified) {
      const { createEmailOTP, sendVerificationEmail } = await import("@/lib/mail");
      const otp = await createEmailOTP(user.email);
      await sendVerificationEmail(user.email, user.name, otp);
      return NextResponse.redirect(new URL(`/verify?email=${encodeURIComponent(user.email)}`, request.url));
    }

    await createSession(user.id);

    // Redirect based on role
    let dest = "/";
    if (user.role === "ADMIN")  dest = "/admin";
    if (user.role === "DEALER") dest = "/portal";
    
    return NextResponse.redirect(new URL(dest, request.url));
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.redirect(new URL("/login?error=unknown", request.url));
  }
}
