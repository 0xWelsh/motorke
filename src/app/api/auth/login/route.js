// src/app/api/auth/login/route.js
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const email    = formData.get("email")?.toString().toLowerCase().trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    if (!user.active) {
      return NextResponse.redirect(new URL("/login?error=inactive", request.url));
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
