import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url), 303);
    }

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();

    if (!name || name.length < 2) {
      return NextResponse.redirect(new URL("/portal/profile?error=invalid", request.url), 303);
    }

    await db.user.update({
      where: { id: session.userId },
      data: { name }
    });

    return NextResponse.redirect(new URL("/portal/profile?saved=1", request.url), 303);

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.redirect(new URL("/portal/profile?error=unknown", request.url), 303);
  }
}
