// src/app/api/setup-admin/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function GET() {
  try {
    const email = "11241welshmuhuri@gmail.com";
    const password = "Welsh@2006";

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Admin account already exists." }, { status: 200 });
    }

    // Create the admin user
    await db.user.create({
      data: {
        name: "Motorke Admin",
        email: email,
        passwordHash: hashPassword(password),
        role: "ADMIN",
        active: true,
      },
    });

    return NextResponse.json({ message: "Admin account successfully created!" }, { status: 201 });
  } catch (error) {
    console.error("Setup Admin Error:", error);
    return NextResponse.json({ error: "Failed to create admin account.", details: error.message }, { status: 500 });
  }
}
