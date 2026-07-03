// src/app/api/admin/create-admin/route.js
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    await requireSuperAdmin();

    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role === "ADMIN") {
        return Response.json({ error: "User is already an admin." }, { status: 409 });
      }
      await db.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      return Response.json({ success: true, message: `${email} promoted to admin.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.user.create({
      data: { name, email, passwordHash, role: "ADMIN", active: true, emailVerified: new Date() },
    });

    return Response.json({ success: true, message: `Admin ${email} created.` });
  } catch (err) {
    console.error("create-admin error:", err);
    return Response.json({ error: "Failed to create admin." }, { status: 500 });
  }
}
