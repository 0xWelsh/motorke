// src/app/api/migrate-to-r2/route.js
// One-shot migration from Supabase Storage to Cloudflare R2. Covers car
// images (car_images.url) plus user avatars (users.avatarUrl) and dealer
// logo/banner (dealers.logoUrl / dealers.bannerUrl). Idempotent: rows whose
// URL already points at R2_PUBLIC_URL are skipped. Thumbnails are generated
// only for car image keys (cars/).
//
// Trigger with: GET /api/migrate-to-r2?token=<MIGRATE_R2_TOKEN>

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

/**
 * Migrate a single object from Supabase Storage to R2.
 * @returns {{ status: "migrated"|"skipped"|"failed", notes?: string[], error?: string }}
 */
async function migrateOne({ sourceUrl, makeThumbs, updateRow }) {
  if (!sourceUrl) return { status: "skipped" };
  if (sourceUrl.startsWith(R2_PUBLIC_URL)) return { status: "skipped" };

  const key = supabaseUrlToKey(sourceUrl);
  if (!key) return { status: "skipped" };

  try {
    let res = await fetch(sourceUrl, { signal: AbortSignal.timeout(15000) });
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

    const notes = [];
    if (makeThumbs) {
      for (const { suffix, width } of THUMB_SIZES) {
        try {
          const thumb = await sharp(buffer, { failOn: "none" })
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          await s3Upload(key.replace(/(\.[^.]+)$/, `${suffix}.webp`), thumb, "image/webp");
        } catch (tErr) {
          notes.push(`thumb ${suffix}: ${tErr.message}`);
        }
      }
    }

    await updateRow(r2Url(key));
    return { status: "migrated", notes };
  } catch (err) {
    return { status: "failed", error: err.message };
  }
}

function tally(results, counter, out, label) {
  if (out.status === "migrated") {
    results[counter]++;
    for (const note of out.notes || []) results.errors.push(`${label} ${note}`);
  } else if (out.status === "skipped") {
    results.skipped++;
  } else {
    results.failed++;
    results.errors.push(`${label} ${out.error}`);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { carImages: 0, avatars: 0, logos: 0, banners: 0, failed: 0, skipped: 0, errors: [] };

  const images = await db.carImage.findMany({ orderBy: { id: "asc" } });
  for (const img of images) {
    const out = await migrateOne({
      sourceUrl: img.url,
      makeThumbs: true,
      updateRow: (url) => db.carImage.update({ where: { id: img.id }, data: { url } }),
    });
    tally(results, "carImages", out, `img ${img.id}`);
    if ((results.carImages + results.failed) % 10 === 0) {
      console.log(`[migrate] ${results.carImages} car images done, ${results.failed} failed`);
    }
  }

  const users = await db.user.findMany({
    where: { avatarUrl: { not: null } },
    select: { id: true, avatarUrl: true },
  });
  for (const user of users) {
    const out = await migrateOne({
      sourceUrl: user.avatarUrl,
      makeThumbs: false,
      updateRow: (url) => db.user.update({ where: { id: user.id }, data: { avatarUrl: url } }),
    });
    tally(results, "avatars", out, `user ${user.id}`);
  }

  const dealers = await db.dealer.findMany({ select: { id: true, logoUrl: true, bannerUrl: true } });
  for (const dealer of dealers) {
    if (dealer.logoUrl) {
      const out = await migrateOne({
        sourceUrl: dealer.logoUrl,
        makeThumbs: false,
        updateRow: (url) => db.dealer.update({ where: { id: dealer.id }, data: { logoUrl: url } }),
      });
      tally(results, "logos", out, `dealer ${dealer.id} logo`);
    }
    if (dealer.bannerUrl) {
      const out = await migrateOne({
        sourceUrl: dealer.bannerUrl,
        makeThumbs: false,
        updateRow: (url) => db.dealer.update({ where: { id: dealer.id }, data: { bannerUrl: url } }),
      });
      tally(results, "banners", out, `dealer ${dealer.id} banner`);
    }
  }

  console.log("[migrate] complete", results);
  return NextResponse.json(results);
}
