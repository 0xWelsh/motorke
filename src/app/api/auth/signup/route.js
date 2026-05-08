export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createEmailOTP, sendVerificationEmail } from "@/lib/mail";
import { isCaptchaConfigured, verifyTurnstileToken } from "@/lib/captcha";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { z } from "zod";

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const signupSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
    .regex(/[a-z]/, "Password must include at least one lowercase letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
  confirm: z.string(),
  role: z.enum(["BUYER", "DEALER"]).default("BUYER"),
  dealerName: z.string().trim().max(120).optional(),
  county: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(32).optional(),
  captchaToken: z.string().max(2048).optional(),
  website: z.string().max(0).optional(),
}).refine(data => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"]
});

export async function POST(request) {
  try {
    const wantsJson = request.headers.get("accept")?.includes("application/json");

    const formData = await request.formData();
    const rawData = Object.fromEntries(formData.entries());
    const parsed = signupSchema.safeParse(rawData);
    
    if (!parsed.success) {
      if (wantsJson) return NextResponse.json({ error: "Please fill all required fields correctly." }, { status: 400 });
      return NextResponse.redirect(new URL("/signup?error=invalid", request.url));
    }
    
    const { name, email, password, role, dealerName, county, phone, captchaToken, website } = parsed.data;

    if (website) {
      if (wantsJson) return NextResponse.json({ error: "Please fill all required fields correctly." }, { status: 400 });
      return NextResponse.redirect(new URL("/signup?error=invalid", request.url));
    }

    const ip = getClientIp(request);

    const ipLimit = checkRateLimit({
      name: "signup-ip",
      key: ip,
      windowMs: 10 * 60 * 1000,
      maxRequests: 10,
    });
    if (ipLimit.limited) {
      if (wantsJson) return NextResponse.json({ error: "Too many signup attempts. Please try again shortly." }, { status: 429 });
      return NextResponse.redirect(new URL("/signup?error=too_many", request.url));
    }

    const emailLimit = checkRateLimit({
      name: "signup-email",
      key: email,
      windowMs: 10 * 60 * 1000,
      maxRequests: 5,
    });
    if (emailLimit.limited) {
      if (wantsJson) return NextResponse.json({ error: "Too many signup attempts. Please try again shortly." }, { status: 429 });
      return NextResponse.redirect(new URL("/signup?error=too_many", request.url));
    }

    if (isCaptchaConfigured()) {
      const captchaCheck = await verifyTurnstileToken({ token: captchaToken, ip });
      if (!captchaCheck.success) {
        if (wantsJson) return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
        return NextResponse.redirect(new URL("/signup?error=captcha", request.url));
      }
    }

    if (role === "DEALER" && (!dealerName || !phone)) {
       if (wantsJson) return NextResponse.json({ error: "Missing required dealership details." }, { status: 400 });
       return NextResponse.redirect(new URL("/signup?error=invalid", request.url));
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      // Recovery path: if account exists but is not verified, issue a fresh OTP and continue verification flow.
      if (!existing.emailVerified) {
        const emailOtp = await createEmailOTP(email);
        const verificationSend = await sendVerificationEmail(email, existing.name || name, emailOtp);
        if (!verificationSend?.success) {
          console.error("Verification resend failed:", verificationSend?.error);
          if (wantsJson) {
            return NextResponse.json(
              { error: "We could not send the verification code right now. Please contact support at hello@welshmotorhub.co.ke." },
              { status: 502 }
            );
          }
          return NextResponse.redirect(new URL("/signup?error=mail", request.url));
        }
        const redirectUrl = `/verify?email=${encodeURIComponent(email)}`;
        if (wantsJson) return NextResponse.json({ success: true, redirect: redirectUrl, resent: true });
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      if (wantsJson) return NextResponse.json({ error: "An account with that email already exists." }, { status: 400 });
      return NextResponse.redirect(new URL("/signup?error=exists", request.url));
    }

    let parsedDealerId = null;

    if (role === "DEALER") {
      const slug = slugify(dealerName);
      
      const existingDealer = await db.dealer.findUnique({ where: { slug } });
      const finalSlug = existingDealer ? `${slug}-${Date.now()}` : slug;

      const newDealer = await db.dealer.create({
         data: {
           name: dealerName,
           slug: finalSlug,
           phone: phone,
           county: county || "Nairobi",
           location: rawData.location?.toString().trim() || "Headquarters",
           address:  rawData.address?.toString().trim() || null,
           whatsapp: rawData.whatsapp?.toString().trim() || null,
           description: rawData.description?.toString().trim() || null,
           lat:      rawData.lat ? parseFloat(rawData.lat) : null,
           lng:      rawData.lng ? parseFloat(rawData.lng) : null,
           verified: false,
         }
      });
      parsedDealerId = newDealer.id;
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: role,
        dealerId: parsedDealerId,
        active: true,
      },
    });

    // ── OTP Verification Dispatch (Email Only) ─────────────────
    const emailOtp = await createEmailOTP(email);
    const verificationSend = await sendVerificationEmail(email, name, emailOtp);
    if (!verificationSend?.success) {
      console.error("Verification dispatch failed:", verificationSend?.error);

      // Roll back partial signup so the user can retry cleanly.
      await db.$transaction(async (tx) => {
        await tx.verificationToken.deleteMany({ where: { identifier: email } });
        await tx.user.delete({ where: { id: user.id } });
        if (parsedDealerId) {
          await tx.dealer.delete({ where: { id: parsedDealerId } });
        }
      });

      if (wantsJson) {
        return NextResponse.json(
          { error: "Signup could not be completed because verification email failed to send. Please try again or contact hello@welshmotorhub.co.ke." },
          { status: 502 }
        );
      }
      return NextResponse.redirect(new URL("/signup?error=mail", request.url));
    }
    
    // Redirect all users to the interactive Verification Portal first
    const redirectUrl = `/verify?email=${encodeURIComponent(email)}`;
    if (wantsJson) return NextResponse.json({ success: true, redirect: redirectUrl });
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (err) {
    console.error("Signup error:", err);
    const wantsJson = request.headers.get("accept")?.includes("application/json");
    if (wantsJson) return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
    return NextResponse.redirect(new URL("/signup?error=unknown", request.url));
  }
}
