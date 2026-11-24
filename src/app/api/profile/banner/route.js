import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { uploadImage, deleteImage } from "@/lib/storage";

// Profile banner (16:9 header art). Mirrors the avatar route's rules.
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("banner");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 8MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop();
    const path = `banners/${session.user.id}-${Date.now()}.${ext}`;
    const bannerUrl = await uploadImage(buffer, path, file.type);

    const prev = await db.user.findUnique({
      where: { id: session.user.id },
      select: { bannerUrl: true },
    });
    await db.user.update({ where: { id: session.user.id }, data: { bannerUrl } });
    if (prev?.bannerUrl) await deleteImage(prev.bannerUrl).catch(() => {});

    return NextResponse.json({ success: true, bannerUrl });
  } catch (error) {
    console.error("Banner upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { bannerUrl: true },
    });
    if (user?.bannerUrl) await deleteImage(user.bannerUrl).catch(() => {});
    await db.user.update({ where: { id: session.user.id }, data: { bannerUrl: null } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banner delete error:", error);
    return NextResponse.json({ error: "Failed to remove banner" }, { status: 500 });
  }
}
