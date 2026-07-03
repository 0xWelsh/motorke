export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url), 303);
    }

    const formData = await request.formData();
    const password = formData.get("password")?.toString();
    const confirm = formData.get("confirm")?.toString();

    if (!password || password.length < 6 || password !== confirm) {
      return NextResponse.redirect(new URL("/account?profile=error=password_mismatch", request.url), 303);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hashedPassword }
    });

    return NextResponse.redirect(new URL("/account?profile=saved=1", request.url), 303);

  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.redirect(new URL("/account?profile=error=unknown", request.url), 303);
  }
}
