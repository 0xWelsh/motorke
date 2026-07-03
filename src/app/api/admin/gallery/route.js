// src/app/api/admin/gallery/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/storage";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

async function uploadFile(file, prefix) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name?.split(".").pop() || "jpg";
  const filename = `gallery/${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const url = await uploadImage(buffer, filename, file.type);
  return url;
}

export async function POST(request) {
  await requireAdmin();

  try {
    const formData = await request.formData();
    const method = formData.get("_method")?.toString();

    if (method === "DELETE") {
      const id = formData.get("id")?.toString();
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      await db.galleryPost.delete({ where: { id } });
      return NextResponse.redirect(new URL("/admin/gallery", request.url));
    }

    const title = formData.get("title")?.toString().trim();
    const rawSlug = formData.get("slug")?.toString().trim();
    const type = formData.get("type")?.toString() || "event";
    const date = formData.get("date")?.toString();
    const location = formData.get("location")?.toString().trim() || null;
    const description = formData.get("description")?.toString().trim() || null;
    const magazineLink = formData.get("magazineLink")?.toString().trim() || null;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let slug = rawSlug || slugifyCarSegment(title);
    if (!slug) slug = `post-${Date.now()}`;

    const existing = await db.galleryPost.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const coverFile = formData.get("coverImage");
    let coverImage = null;
    if (coverFile && typeof coverFile !== "string" && coverFile.size > 0) {
      coverImage = await uploadFile(coverFile, "covers");
    }

    const imageFiles = formData.getAll("galleryImages");
    const videoFiles = formData.getAll("galleryVideos");
    const images = [];
    for (const file of imageFiles) {
      if (file && typeof file !== "string" && file.size > 0) {
        const url = await uploadFile(file, slug);
        images.push({ url, caption: "", type: "image" });
      }
    }
    for (const file of videoFiles) {
      if (file && typeof file !== "string" && file.size > 0) {
        const url = await uploadFile(file, slug);
        images.push({ url, caption: "", type: "video" });
      }
    }

    await db.galleryPost.create({
      data: {
        slug,
        type,
        title,
        date: new Date(date || Date.now()),
        location,
        description,
        coverImage,
        images: images.length ? images : undefined,
        magazineLink,
      },
    });

    return NextResponse.redirect(new URL("/admin/gallery", request.url));
  } catch (err) {
    console.error("Gallery post error:", err);
    return NextResponse.json({ error: "Failed to create gallery post" }, { status: 500 });
  }
}


