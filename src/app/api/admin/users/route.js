// src/app/api/admin/users/route.js  — POST create user
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData  = await request.formData();
  const name      = formData.get("name")?.toString().trim();
  const email     = formData.get("email")?.toString().toLowerCase().trim();
  const password  = formData.get("password")?.toString();
  const confirm   = formData.get("confirm")?.toString();
  const role      = formData.get("role")?.toString() || "DEALER";
  const dealerId  = formData.get("dealerId")?.toString() || null;

  if (role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin/users/new?error=notallowed", request.url));
  }

  if (password !== confirm) {
    return NextResponse.redirect(new URL("/admin/users/new?error=mismatch", request.url));
  }

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.redirect(new URL("/admin/users/new?error=exists", request.url));
    }

    const hashedPassword = await hashPassword(password);
    
    await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        dealerId: dealerId || null,
        active: true,
      },
    });

    return NextResponse.redirect(new URL("/admin/users?created=1", request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/admin/users/new?error=unknown", request.url));
  }
}
