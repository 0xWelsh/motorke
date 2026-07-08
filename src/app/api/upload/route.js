// src/app/api/upload/route.js
// Receives a file from the CarForm, uploads to Supabase Storage
// Returns { url } — the public URL stored in the database

import sharp from "sharp";
import { uploadImage, imagePath } from "@/lib/storage";
import { applyListingWatermark } from "@/lib/watermark";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

const MAX_SIZE_MB = 3;
const MAX_DIMENSION = 1200;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
        { error: "Only JPG, PNG, and WEBP images are allowed" },
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

    // Resize to cap the longest dimension so phones aren't downloading
    // 4000px originals. Failure is non-fatal — fall back to raw buffer.
    let processedBuffer = buffer;
    try {
      processedBuffer = await sharp(buffer, { failOn: "none" })
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .toBuffer();
    } catch (resizeError) {
      console.error("Image resize failed:", resizeError);
      processedBuffer = buffer;
    }

    // Apply the brand watermark before upload. Failure is non-fatal —
    // we'd rather have an un-watermarked listing than block the dealer
    // from uploading.
    try {
      processedBuffer = await applyListingWatermark(processedBuffer, file.type);
    } catch (watermarkError) {
      console.error("Watermark processing failed:", watermarkError);
    }

    // Generate a unique path
    const path = imagePath(
      `tmp-${session.user.id}`,   // temp prefix; overwritten when car is saved
      Date.now(),
      file.type
    );

    const url = await uploadImage(processedBuffer, path, file.type);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
