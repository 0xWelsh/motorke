export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createEmailOTP, sendVerificationEmail } from "@/lib/mail";
import { verifyTurnstileToken } from "@/lib/captcha";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const signupSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8),
  confirm: z.string(),
  role: z.enum(["BUYER", "DEALER"]).default("BUYER"),
  dealerName: z.string().optional(),
  county: z.string().optional(),
  phone: z.string().optional(),
  captchaToken: z.string().optional(),
  website: z.string().optional(),
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

    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

    // Rate limit signup attempts per IP
    const ipLimit = checkRateLimit({
      name: "signup-ip",
      key: ip,
      windowMs: 3600000, // 1 hour
      maxRequests: 3,
    });

    if (ipLimit.limited) {
      if (wantsJson) return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });
      return NextResponse.redirect(new URL("/signup?error=too_many", request.url));
    }

    // Verify captcha if token is provided (optional for now - allow signup even if captcha fails)
    if (captchaToken && captchaToken.trim()) {
      const captchaCheck = await verifyTurnstileToken({ token: captchaToken, ip });
      // Log but don't block - captcha is optional during beta
      if (!captchaCheck.success) {
        console.warn(`Captcha verification failed for IP ${ip}: ${captchaCheck.reason}`);
      }
    }

    if (role === "DEALER" && (!dealerName || !phone)) {
       if (wantsJson) return NextResponse.json({ error: "Missing required dealership details." }, { status: 400 });
       return NextResponse.redirect(new URL("/signup?error=invalid", request.url));
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
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
    await sendVerificationEmail(email, name, emailOtp);
    
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
