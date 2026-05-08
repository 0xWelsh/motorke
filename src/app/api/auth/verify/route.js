export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, json429, normalizeEmail, normalizeToken } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  emailOtp: z.string().min(4).max(12),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    const email = parsed.success ? normalizeEmail(parsed.data.email) : null;
    const emailOtp = parsed.success ? normalizeToken(parsed.data.emailOtp, 12) : null;

    if (!email || !emailOtp) {
      return NextResponse.json({ error: "Email and Verification Code are required." }, { status: 400 });
    }
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit({
      name: "verify-email-ip",
      key: ip,
      windowMs: 10 * 60 * 1000,
      maxRequests: 30,
    });
    if (ipLimit.limited) {
      return json429("Too many verification attempts. Please try again shortly.", ipLimit.retryAfter);
    }
    const tokenLimit = checkRateLimit({
      name: "verify-email-token",
      key: `${email}:${emailOtp}`,
      windowMs: 10 * 60 * 1000,
      maxRequests: 8,
    });
    if (tokenLimit.limited) {
      return json429("Too many attempts for this code. Please request a new one.", tokenLimit.retryAfter);
    }

    // Verify Email Token
    const emailToken = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token: emailOtp } }
    });
    
    if (!emailToken) {
      return NextResponse.json({ error: "Invalid Email Code." }, { status: 400 });
    }
    if (emailToken.expires < new Date()) {
      return NextResponse.json({ error: "Email Code has expired." }, { status: 400 });
    }

    // Validation successful -> Mark User Verified
    const user = await db.user.update({
       where: { email },
       data: { emailVerified: new Date() }
    });

    // Clean up used tokens
    await db.verificationToken.deleteMany({
       where: { identifier: email }
    });

    await createSession(user.id);

    void sendWelcomeEmail({
      email: user.email,
      name: user.name,
      role: user.role,
    }).catch((e) => console.error("Welcome email:", e));

    const redirectUrl = user.role === "DEALER" ? "/portal" : "/";
    return NextResponse.json({ success: true, redirect: redirectUrl });

  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "An unexpected error occurred during verification." }, { status: 500 });
  }
}
