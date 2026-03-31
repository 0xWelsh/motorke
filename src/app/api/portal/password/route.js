// src/app/api/portal/password/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest, verifyPassword, hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const contentType = request.headers.get("content-type") || "";
  let current, newPassword, confirm;
  if (contentType.includes("application/json")) {
    const body = await request.json();
    current = body.current; newPassword = body.newPassword; confirm = body.confirm;
  } else {
    const fd = await request.formData();
    current = fd.get("current")?.toString();
    newPassword = fd.get("newPassword")?.toString();
    confirm = fd.get("confirm")?.toString();
  }

  if (!current || !newPassword || !confirm) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  if (newPassword !== confirm) {
    return NextResponse.json({ error: "mismatch" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "short" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!verifyPassword(current, user.passwordHash)) {
    return NextResponse.json({ error: "wrong" }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.userId },
    data:  { passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.json({ success: true });
}
