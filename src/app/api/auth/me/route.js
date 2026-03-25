// src/app/api/auth/me/route.js
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id:    session.userId,
        email: session.user.email,
        name:  session.user.name,
        role:  session.user.role,
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
