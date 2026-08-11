#!/usr/bin/env node
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const prisma = new PrismaClient();

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "bidgari";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const SUPABASE_PUBLIC = "/storage/v1/object/public/car-images/";

const THUMB_SIZES = [
  { suffix: "-200w", width: 200 },
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

function r2Url(key) {
  return `${R2_PUBLIC_URL}/${key}`;
}

async function migrateImage(imageRecord) {
  const oldUrl = imageRecord.url;
  const key = supabaseUrlToKey(oldUrl);
  if (!key) {
    console.log(`  skip (not supabase): ${imageRecord.id}`);
    return null;
  }

  const res = await fetch(oldUrl);
  if (!res.ok) {
    console.error(`  fetch failed (${res.status}): ${imageRecord.id}`);
    return null;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get("content-type") || "image/jpeg";

  await s3Upload(key, buffer, mimeType);

  for (const { suffix, width } of THUMB_SIZES) {
    try {
      const thumb = await sharp(buffer, { failOn: "none" })
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      const thumbKey = key.replace(/(\.[^.]+)$/, `${suffix}.webp`);
      await s3Upload(thumbKey, thumb, "image/webp");
    } catch (err) {
      console.warn(`  thumbnail ${suffix} failed: ${err?.message || err}`);
    }
  }

  return r2Url(key);
}

async function main() {
  console.log("=== Migrating CarImage records ===");
  const images = await prisma.carImage.findMany({
    orderBy: { id: "asc" },
  });
  console.log(`Found ${images.length} car images`);

  let migrated = 0;
  let failed = 0;

  for (const img of images) {
    if (img.url && img.url.includes(R2_PUBLIC_URL)) {
      continue;
    }
    const newUrl = await migrateImage(img);
    if (newUrl) {
      await prisma.carImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });
      migrated++;
    } else {
      failed++;
    }

    if ((migrated + failed) % 20 === 0) {
      console.log(`  progress: ${migrated} migrated, ${failed} failed`);
    }
  }
  console.log(`CarImage done: ${migrated} migrated, ${failed} failed`);

  console.log("\n=== Migrating User avatars ===");
  const users = await prisma.user.findMany({
    where: { avatarUrl: { not: null } },
    select: { id: true, avatarUrl: true },
  });
  let avatarsMigrated = 0;
  for (const user of users) {
    if (user.avatarUrl.includes(R2_PUBLIC_URL)) continue;
    const res = await fetch(user.avatarUrl);
    if (!res.ok) { console.error(`  fetch failed for ${user.id}`); continue; }
    const buffer = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    const pathIdx = user.avatarUrl.indexOf("avatars/");
    if (pathIdx === -1) continue;
    const key = user.avatarUrl.slice(pathIdx);
    await s3Upload(key, buffer, mimeType);
    const newUrl = r2Url(key);
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: newUrl } });
    avatarsMigrated++;
  }
  console.log(`Avatars: ${avatarsMigrated} migrated`);

  console.log("\n=== Migrating Gallery posts ===");
  const galleries = await prisma.galleryPost.findMany();
  let galleryMigrated = 0;
  for (const g of galleries) {
    let changed = false;

    if (g.coverImage && !g.coverImage.includes(R2_PUBLIC_URL)) {
      const pathIdx = g.coverImage.indexOf("car-images/");
      const key = pathIdx !== -1 ? g.coverImage.slice(pathIdx + "car-images/".length) : null;
      if (key) {
        const res = await fetch(g.coverImage);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const mime = res.headers.get("content-type") || "image/jpeg";
          await s3Upload(key, buf, mime);
          await prisma.galleryPost.update({
            where: { id: g.id },
            data: { coverImage: r2Url(key) },
          });
          changed = true;
        }
      }
    }

    if (g.images && Array.isArray(g.images)) {
      const updatedImages = [];
      for (const img of g.images) {
        if (img.url && img.url.includes(R2_PUBLIC_URL)) {
          updatedImages.push(img);
          continue;
        }
        const pathIdx = img.url?.indexOf("car-images/") ?? -1;
        const key = pathIdx !== -1 ? img.url.slice(pathIdx + "car-images/".length) : null;
        if (!key) { updatedImages.push(img); continue; }
        const res = await fetch(img.url);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const mime = res.headers.get("content-type") || "image/jpeg";
          await s3Upload(key, buf, mime);
          updatedImages.push({ ...img, url: r2Url(key) });
          changed = true;
        } else {
          updatedImages.push(img);
        }
      }
      if (changed) {
        await prisma.galleryPost.update({
          where: { id: g.id },
          data: { images: updatedImages },
        });
      }
    }

    if (changed) galleryMigrated++;
  }
  console.log(`Gallery posts: ${galleryMigrated} migrated`);

  console.log("\n=== Done ===");
}

main()
  .catch((err) => {
    console.error("Fatal:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
