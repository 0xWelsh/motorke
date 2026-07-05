export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { uploadImage, deleteImage } from "@/lib/storage";

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
    const filename = `${folder}/${targetType}-${targetId}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage instead of local filesystem
    const imageUrl = await uploadImage(buffer, filename, file.type);

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

export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetId, targetType } = await request.json();

    if (!targetId || !targetType) {
      return NextResponse.json({ error: "Missing target info" }, { status: 400 });
    }

    if (targetType === "dealer") {
      const dealer = await db.dealer.findUnique({
        where: { id: targetId },
        select: { logoUrl: true },
      });
      if (dealer?.logoUrl) {
        await deleteImage(dealer.logoUrl);
      }
      await db.dealer.update({
        where: { id: targetId },
        data: { logoUrl: null },
      });
    } else {
      const user = await db.user.findUnique({
        where: { id: targetId },
        select: { avatarUrl: true },
      });
      if (user?.avatarUrl) {
        await deleteImage(user.avatarUrl);
      }
      await db.user.update({
        where: { id: targetId },
        data: { avatarUrl: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin avatar delete error:", error);
    return NextResponse.json({ error: "Failed to remove photo" }, { status: 500 });
  }
}
