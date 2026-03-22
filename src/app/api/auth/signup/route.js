// src/app/api/auth/signup/route.js
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name     = formData.get("name")?.toString().trim();
    const email    = formData.get("email")?.toString().toLowerCase().trim();
    const password = formData.get("password")?.toString();
    const confirm  = formData.get("confirm")?.toString();

    if (!name || !email || !password) {
      return NextResponse.redirect(new URL("/signup?error=unknown", request.url));
    }

    if (password.length < 8) {
      return NextResponse.redirect(new URL("/signup?error=short", request.url));
    }

    if (password !== confirm) {
      return NextResponse.redirect(new URL("/signup?error=mismatch", request.url));
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.redirect(new URL("/signup?error=exists", request.url));
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role:   "BUYER",
        active: true,
      },
    });

    await createSession(user.id);
    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.redirect(new URL("/signup?error=unknown", request.url));
  }
}