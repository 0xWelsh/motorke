import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");
    const targetId = formData.get("targetId");
    const targetType = formData.get("targetType"); // "user" or "dealer"

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!targetId || !targetType) {
      return NextResponse.json({ error: "Missing target info" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF images are allowed." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop();
    const folder = targetType === "dealer" ? "logos" : "avatars";
    const filename = `${targetType}-${targetId}-${Date.now()}.${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    const imageUrl = `/uploads/${folder}/${filename}`;

    if (targetType === "dealer") {
      await db.dealer.update({
        where: { id: targetId },
        data: { logoUrl: imageUrl }
      });
    } else {
      await db.user.update({
        where: { id: targetId },
        data: { avatarUrl: imageUrl }
      });
    }

    return NextResponse.json({ success: true, imageUrl });

  } catch (error) {
    console.error("Admin avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
