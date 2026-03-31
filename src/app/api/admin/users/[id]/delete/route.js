// src/app/api/admin/users/[id]/delete/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();

  // Admin authorization
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Prevent self-deletion
  if (session.user.id === id) {
    return NextResponse.redirect(new URL(`/admin/users/${id}/edit?error=self_delete`, request.url));
  }

  try {
    // Delete the user from the database
    await db.user.delete({
      where: { id: id },
    });

    // Redirect to the users list on success
    return NextResponse.redirect(new URL(`/admin/users?deleted=1`, request.url));
  } catch (err) {
    console.error("Failed to delete user:", err);
    return NextResponse.redirect(new URL(`/admin/users/${id}/edit?error=delete_failed`, request.url));
  }
}
