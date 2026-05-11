import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import {
  verifyGoogleToken,
  upsertGoogleUser,
  maybeWelcomeEmail,
  destinationForRole,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const payload = await verifyGoogleToken(token);
    if (!payload?.email) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const { user, isNew } = await upsertGoogleUser({
      email: payload.email,
      name: payload.name,
      googleId: payload.sub,
      avatarUrl: payload.picture,
    });

    if (!user.active) {
      return NextResponse.json({ error: "User is inactive" }, { status: 403 });
    }

    await createSession(user.id);
    void maybeWelcomeEmail({ user, isNew });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      destination: destinationForRole(user.role),
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
