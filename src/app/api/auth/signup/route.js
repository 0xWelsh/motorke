import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { createVerificationToken, sendVerificationEmail } from "@/lib/mail";
import { NextResponse } from "next/server";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8),
  confirm: z.string()
}).refine(data => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"]
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const rawData = Object.fromEntries(formData.entries());
    const parsed = signupSchema.safeParse(rawData);
    
    if (!parsed.success) {
      return NextResponse.redirect(new URL("/signup?error=invalid", request.url));
    }
    
    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.redirect(new URL("/signup?error=exists", request.url));
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role:   "BUYER",
        active: true,
      },
    });

    // ── Email Verification Setup ─────────────────────────────
    const { token } = await createVerificationToken(email);
    await sendVerificationEmail(email, name, token);

    await createSession(user.id);
    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.redirect(new URL("/signup?error=unknown", request.url));
  }
}
