// src/app/api/portal/password/route.js
import { db } from "@/lib/db";
import { getSessionFromRequest, verifyPassword, hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData    = await request.formData();
  const current     = formData.get("current")?.toString();
  const newPassword = formData.get("newPassword")?.toString();
  const confirm     = formData.get("confirm")?.toString();

  const redirectBase = session.user.role === "DEALER" ? "/portal/profile" : "/admin";

  if (!current || !newPassword || !confirm) {
    return NextResponse.redirect(new URL(`${redirectBase}?pwError=missing`, request.url));
  }

  if (newPassword !== confirm) {
    return NextResponse.redirect(new URL(`${redirectBase}?pwError=mismatch`, request.url));
  }

  if (newPassword.length < 8) {
    return NextResponse.redirect(new URL(`${redirectBase}?pwError=short`, request.url));
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });

  if (!verifyPassword(current, user.passwordHash)) {
    return NextResponse.redirect(new URL(`${redirectBase}?pwError=wrong`, request.url));
  }

  await db.user.update({
    where: { id: session.userId },
    data:  { passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.redirect(new URL(`${redirectBase}?pwSaved=1`, request.url));
}
