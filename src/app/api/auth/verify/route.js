export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mail";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, emailOtp } = await request.json();

    if (!email || !emailOtp) {
      return NextResponse.json({ error: "Email and Verification Code are required." }, { status: 400 });
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
