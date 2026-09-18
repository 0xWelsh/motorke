// src/app/api/admin/users/[id]/route.js  — POST update user
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

  const formData = await request.formData();
  const email    = formData.get("email")?.toString().toLowerCase().trim();
  const name     = formData.get("name")?.toString().trim();
  const role     = formData.get("role")?.toString()     || "DEALER";
  const dealerId = formData.get("dealerId")?.toString() || null;

  // Prevent an admin from promoting another user to ADMIN (only self-promotion allowed)
  if (role === "ADMIN" && id !== session.user.id) {
    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?error=notallowed`, request.url)
    );
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.redirect(new URL("/admin/users", request.url));
  }

  // Revoking admin privileges (ADMIN → anything else) is super-admin only,
  // and the super-admin account itself can never be demoted.
  const removingAdmin = target.role === "ADMIN" && role !== "ADMIN";
  if (removingAdmin) {
    if (session.user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(
        new URL(`/admin/users/${id}/edit?error=revoke`, request.url)
      );
    }
    if (target.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(
        new URL(`/admin/users/${id}/edit?error=superadmin`, request.url)
      );
    }
  }

  try {
    // Check email uniqueness (excluding self)
    const existing = await db.user.findFirst({
      where: { email, id: { not: id } },
    });
    if (existing) {
      return NextResponse.redirect(
        new URL(`/admin/users/${id}/edit?error=exists`, request.url)
      );
    }

    await db.user.update({
      where: { id: id },
      data:  { name, email, role, dealerId: dealerId || null },
    });

    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?saved=profile`, request.url)
    );
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?error=unknown`, request.url)
    );
  }
}
