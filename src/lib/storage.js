import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "bidgari";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

/** Public origin of our object storage — used to validate uploaded URLs. */
export function storagePublicOrigin() {
  return R2_PUBLIC_URL;
}

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
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

/**
 * Lightweight bucket reachability check used by /api/health and monitoring.
 * Verifies R2 endpoint + credentials + bucket in one S3 HeadBucket call.
 * Does NOT check public accessibility (R2 doesn't expose that via S3); the
 * per-object HEAD probes in the diagnostics/cron routes cover that instead.
 * @returns {{ configured: boolean, reachable: boolean, name: string, error?: string, status?: number }}
 */
export async function probeR2Bucket() {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
    return { configured: false, reachable: false, name: R2_BUCKET_NAME, error: "env_missing" };
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }), { abortSignal: controller.signal });
    return { configured: true, reachable: true, name: R2_BUCKET_NAME };
  } catch (err) {
    return {
      configured: true,
      reachable: false,
      name: R2_BUCKET_NAME,
      status: err?.$metadata?.httpStatusCode ?? err?.name ?? "network_error",
      error: err?.name === "AbortError" ? "timeout" : "bucket_unreachable",
    };
  } finally {
    clearTimeout(t);
  }
}

export async function uploadImage(buffer, filename, mimeType, _bucketNameIgnored) {
  await s3Upload(filename, buffer, mimeType);

  if (filename.startsWith("cars/")) {
    for (const { suffix, width } of THUMB_SIZES) {
      try {
        const thumb = await sharp(buffer, { failOn: "none" })
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        const thumbKey = filename.replace(/(\.[^.]+)$/, `${suffix}.webp`);
        await s3Upload(thumbKey, thumb, "image/webp");
      } catch (err) {
        console.warn(`[storage] thumbnail ${suffix} failed:`, err?.message || err);
      }
    }
  }

  return `${R2_PUBLIC_URL}/${filename}`;
}

export async function deleteImage(publicUrl) {
  const key = extractKey(publicUrl);
  if (!key) return;

  const keysToDelete = [key];
  const base = key.replace(/(\.[^.]+)$/, "");
  const ext = key.match(/\.[^.]+$/)?.[0] || "";
  for (const { suffix } of THUMB_SIZES) {
    if (key.startsWith("cars/")) {
      keysToDelete.push(`${base}${suffix}.webp`);
    }
  }

  for (const k of keysToDelete) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: k }));
    } catch (err) {
      console.warn(`[storage] delete failed for ${k}:`, err?.message || err);
    }
  }
}

export function imagePath(carId, index, mimeType) {
  const ext = mimeType === "image/png" ? "png"
            : mimeType === "image/webp" ? "webp"
            : "jpg";
  return `cars/${carId}/${Date.now()}-${index}.${ext}`;
}

function extractKey(publicUrl) {
  if (!publicUrl || typeof publicUrl !== "string") return null;
  const prefix = `${R2_PUBLIC_URL}/`;
  if (publicUrl.startsWith(prefix)) {
    return publicUrl.slice(prefix.length);
  }
  return null;
}
