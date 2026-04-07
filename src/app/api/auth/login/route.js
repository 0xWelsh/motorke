export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { verifyTurnstileToken } from "@/lib/captcha";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
  captchaToken: z.string().min(2),
  website: z.string().optional(),
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

    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const captchaCheck = await verifyTurnstileToken({ token: captchaToken, ip });
    if (!captchaCheck.success) {
      return NextResponse.redirect(new URL("/login?error=captcha", request.url));
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
