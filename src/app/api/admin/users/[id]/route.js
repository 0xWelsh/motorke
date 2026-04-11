// src/app/api/admin/users/[id]/route.js  — POST update user
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
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

  // Removed arbitrary restriction preventing admins from promoting other admins
  /*
  if (role === "ADMIN" && id !== session.user.id) {
    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?error=notallowed`, request.url)
    );
  }
  */

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
      new URL(`/admin/users/${id}/edit?saved=1`, request.url)
    );
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(
      new URL(`/admin/users/${id}/edit?error=unknown`, request.url)
    );
  }
}
