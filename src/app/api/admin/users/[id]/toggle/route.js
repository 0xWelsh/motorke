// src/app/api/admin/users/[id]/toggle/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Prevent admin from suspending themselves
  if (id === session.userId) {
    return NextResponse.redirect(new URL("/admin/users?error=self", request.url));
  }

  const user = await db.user.findUnique({ where: { id: id } });
  if (!user) return NextResponse.redirect(new URL("/admin/users", request.url));

  await db.user.update({
    where: { id: id },
    data:  { active: !user.active },
  });

  // Kill their sessions if suspending
  if (user.active) {
    await db.session.deleteMany({ where: { userId: id } });
  }

  return NextResponse.redirect(new URL("/admin/users", request.url));
}
