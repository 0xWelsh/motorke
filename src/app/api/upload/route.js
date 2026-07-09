// src/app/api/upload/route.js
// Receives a file from the CarForm, uploads to Supabase Storage
// Returns { url } — the public URL stored in the database

import sharp from "sharp";
import { uploadImage, imagePath } from "@/lib/storage";
import { applyListingWatermark } from "@/lib/watermark";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

const MAX_SIZE_MB = 4;
const MAX_DIMENSION = 2000;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"];

export async function POST(request) {
  // Must be logged in
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file     = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, HEIC, and AVIF images are allowed" },
        { status: 400 }
      );
    }

    // Validate size
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Image must be under ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Normalise HEIC/HEIF/AVIF to JPEG — sharp's libvips build on Vercel
    // may not include libheif, so we convert early to a format sharp can
    // always decode and re-encode.
    const isHeic = ["image/heic", "image/heif", "image/avif"].includes(file.type);
    const effectiveType = isHeic ? "image/jpeg" : file.type;

    // Resize to cap the longest dimension so phones aren't downloading
    // 4000px originals. Failure is non-fatal — fall back to raw buffer.
    let processedBuffer = buffer;
    try {
      const pipeline = sharp(buffer, { failOn: "none" })
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });
      processedBuffer = isHeic
        ? await pipeline.jpeg({ quality: 90 }).toBuffer()
        : await pipeline.toBuffer();
    } catch (resizeError) {
      console.error("Image resize failed:", resizeError);
      if (isHeic) {
        return NextResponse.json(
          { error: "HEIC/HEIF images aren't supported on this server. Please convert to JPEG or PNG first." },
          { status: 400 }
        );
      }
      processedBuffer = buffer;
    }

    // Apply the brand watermark before upload. Failure is non-fatal —
    // we'd rather have an un-watermarked listing than block the dealer
    // from uploading.
    try {
      processedBuffer = await applyListingWatermark(processedBuffer, effectiveType);
    } catch (watermarkError) {
      console.error("Watermark processing failed:", watermarkError);
    }

    // Generate a unique path
    const path = imagePath(
      `tmp-${session.user.id}`,   // temp prefix; overwritten when car is saved
      Date.now(),
      effectiveType
    );

    const url = await uploadImage(processedBuffer, path, effectiveType);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
