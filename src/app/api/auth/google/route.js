import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyGoogleToken } from "@/lib/google-auth";
import { sendWelcomeEmail } from "@/lib/mail";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const payload = await verifyGoogleToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const { email, name, sub: googleId, picture: avatarUrl } = payload;

    // Find or create user
    let user = await db.user.findUnique({
      where: { email },
    });
    let isNewGoogleUser = false;

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user = await db.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: user.avatarUrl || avatarUrl },
        });
      }
    } else {
      // Create new user (Role defaults to BUYER)
      isNewGoogleUser = true;
      user = await db.user.create({
        data: {
          email,
          name,
          googleId,
          avatarUrl,
          emailVerified: new Date(),
          active: true,
          role: "BUYER",
        },
      });
    }

    if (!user.active) {
      return NextResponse.json({ error: "User is inactive" }, { status: 403 });
    }

    // Create session
    await createSession(user.id);

    if (isNewGoogleUser) {
      void sendWelcomeEmail({
        email: user.email,
        name: user.name,
        role: user.role,
      }).catch((e) => console.error("Welcome email:", e));
    }

    // Determine redirect destination
    let destination = "/";
    if (user.role === "ADMIN") destination = "/admin";
    if (user.role === "DEALER") destination = "/portal";

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      destination 
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
