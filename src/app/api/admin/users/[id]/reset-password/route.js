// src/app/api/admin/users/[id]/reset-password/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const password = formData.get("password")?.toString();

  const pwErrors = [];
  if (!password || password.length < 8) pwErrors.push("short");
  if (!/[A-Z]/.test(password)) pwErrors.push("uppercase");
  if (!/[a-z]/.test(password)) pwErrors.push("lowercase");
  if (!/[0-9]/.test(password)) pwErrors.push("number");
  if (pwErrors.length) {
    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?error=${pwErrors.join("+")}`, request.url)
    );
  }

  try {
    const hashedPassword = await hashPassword(password);

    await db.user.update({
      where: { id: id },
      data:  { passwordHash: hashedPassword },
    });

    // Kill their existing sessions so they must log in with the new password
    await db.session.deleteMany({ where: { userId: id } });

    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?saved=password`, request.url),
      { status: 303 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?error=unknown`, request.url),
      { status: 303 }
    );
  }
}
