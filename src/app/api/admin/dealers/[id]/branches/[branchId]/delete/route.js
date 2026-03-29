import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id, branchId } = await params;
  const session = await getSessionFromRequest();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await db.dealerBranch.delete({
      where: { id: branchId }
    });

    return NextResponse.redirect(new URL(`/admin/dealers/${id}/edit?deleted=1`, request.url));
  } catch (err) {
    console.error("Failed to delete branch:", err);
    return NextResponse.redirect(new URL(`/admin/dealers/${id}/edit?error=delete_failed`, request.url));
  }
}
