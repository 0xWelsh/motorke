// src/app/api/setup-admin/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const email = "11241welshmuhuri@gmail.com";
    const password = "Welsh@2006";

    // Create or update the admin user
    await db.user.upsert({
      where: { email },
      update: {
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        active: true,
      },
      create: {
        name: "Motorke Admin",
        email: email,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        active: true,
      },
    });

    return NextResponse.json({ message: "Admin account successfully set!" }, { status: 200 });
  } catch (error) {
    console.error("Setup Admin Error:", error);
    return NextResponse.json({ error: "Failed to create admin account.", details: error.message }, { status: 500 });
  }
}
