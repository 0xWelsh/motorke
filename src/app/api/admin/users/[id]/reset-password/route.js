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

  if (!password || password.length < 8) {
    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?error=short`, request.url)
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
