// src/app/api/admin/users/[id]/revoke-admin/route.js
// Super-admin only: remove ADMIN privileges from another admin (demote to
// DEALER by default, or BUYER if requested). Kills their sessions so they
// are signed out immediately.
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { SUPER_ADMIN_EMAIL } from "@/lib/super-admin";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session.user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/admin/users?error=superonly", request.url));
  }
  if (id === session.user.id) {
    return NextResponse.redirect(new URL("/admin/users?error=self", request.url));
  }

  const formData = await request.formData();
  const requestedRole = formData.get("role")?.toString().toUpperCase() || "DEALER";
  const targetRole = requestedRole === "BUYER" ? "BUYER" : "DEALER";

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.redirect(new URL("/admin/users", request.url));
  }
  if (target.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/admin/users?error=notadmin", request.url));
  }
  if (target.email === SUPER_ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/admin/users?error=superadmin", request.url));
  }

  await db.user.update({
    where: { id },
    data: { role: targetRole },
  });
  await db.session.deleteMany({ where: { userId: id } });

  return NextResponse.redirect(new URL("/admin/users?revoked=1", request.url));
}
