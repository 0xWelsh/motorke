// src/app/api/admin/dealers/[id]/delete/route.js
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

  try {
    // Deleting the dealer will automatically delete all related cars, leads, branches, images, reviews, and associated user accounts
    // because the Prisma schema is configured with 'onDelete: Cascade' for these relations.
    await db.dealer.delete({ where: { id: id } });

    return NextResponse.redirect(new URL("/admin/dealers", request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(
      new URL(`/admin/dealers/${id}/edit?error=1`, request.url)
    );
  }
}
