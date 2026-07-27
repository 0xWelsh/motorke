import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "bidgari";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const SUPABASE_PUBLIC = "/storage/v1/object/public/car-images/";
const THUMB_SIZES = [
  { suffix: "-400w", width: 400 },
  { suffix: "-800w", width: 800 },
];

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function s3Upload(key, buffer, mimeType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));
}

function supabaseUrlToKey(url) {
  const idx = url.indexOf(SUPABASE_PUBLIC);
  if (idx === -1) return null;
  return url.slice(idx + SUPABASE_PUBLIC.length);
}

function adminFetchUrl(key) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/car-images/${key}`;
}

function adminHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return key ? { "Authorization": `Bearer ${key}` } : {};
}

function r2Url(key) {
  return `${R2_PUBLIC_URL}/${key}`;
}

const AUTH_TOKEN = process.env.MIGRATE_R2_TOKEN || "";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { carImages: 0, failed: 0, skipped: 0, errors: [] };

  const images = await db.carImage.findMany({ orderBy: { id: "asc" } });

  for (const img of images) {
    if (img.url && img.url.startsWith(R2_PUBLIC_URL)) {
      results.skipped++;
      continue;
    }

    const key = supabaseUrlToKey(img.url);
    if (!key) { results.skipped++; continue; }

    try {
      let res = await fetch(img.url, { signal: AbortSignal.timeout(15000) });
      if (res.status === 402) {
        const adminUrl = adminFetchUrl(key);
        if (adminUrl) {
          res = await fetch(adminUrl, { headers: adminHeaders(), signal: AbortSignal.timeout(15000) });
        }
      }
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const mimeType = res.headers.get("content-type") || "image/jpeg";

      await s3Upload(key, buffer, mimeType);

      for (const { suffix, width } of THUMB_SIZES) {
        try {
          const thumb = await sharp(buffer, { failOn: "none" })
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          await s3Upload(key.replace(/(\.[^.]+)$/, `${suffix}.webp`), thumb, "image/webp");
        } catch (tErr) {
          results.errors.push(`thumb ${suffix} for ${img.id}: ${tErr.message}`);
        }
      }

      await db.carImage.update({ where: { id: img.id }, data: { url: r2Url(key) } });
      results.carImages++;
    } catch (err) {
      results.failed++;
      results.errors.push(`img ${img.id}: ${err.message}`);
    }

    if ((results.carImages + results.failed) % 10 === 0) {
      console.log(`[migrate] ${results.carImages} done, ${results.failed} failed`);
    }
  }

  console.log("[migrate] complete", results);
  return NextResponse.json(results);
}
