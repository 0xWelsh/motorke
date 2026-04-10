// src/lib/storage.js
// Supabase Storage for car images
// Bucket is auto-created on first upload if it doesn't exist

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET          = "car-images";

let bucketReady = false;

/**
 * Ensure the storage bucket exists (runs once per server lifecycle).
 */
async function ensureBucket() {
  if (bucketReady) return;

  const headers = { "Authorization": `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };

  // Check if bucket exists
  const check = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, { headers });
  if (check.ok) {
    bucketReady = true;
    return;
  }

  // Create public bucket
  const create = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });

  if (!create.ok) {
    const err = await create.text();
    console.error("Bucket creation response:", err);
    // If it already exists (race condition), that's fine
    if (!err.includes("already exists")) {
      throw new Error(`Failed to create bucket: ${err}`);
    }
  }

  bucketReady = true;
  console.log(`✓ Storage bucket "${BUCKET}" ready`);
}

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL.
 *
 * @param {Buffer} buffer     - File contents
 * @param {string} filename   - e.g. "cars/abc123/photo-0.jpg"
 * @param {string} mimeType   - e.g. "image/jpeg"
 */
export async function uploadImage(buffer, filename, mimeType) {
  await ensureBucket();

  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`;

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type":  mimeType,
      "x-upsert":      "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload failed: ${err}`);
  }

  // Return the public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteImage(publicUrl) {
  // Extract the path after the bucket name
  const marker = `/object/public/${BUCKET}/`;
  const idx    = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);

  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
  try {
    const res = await fetch(url, {
      method:  "DELETE",
      headers: { "Authorization": `Bearer ${SERVICE_KEY}` },
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("Failed to delete storage image:", { path, detail });
    }
  } catch (error) {
    console.error("Storage delete request failed:", { path, error });
  }
}

/**
 * Generate a unique storage path for a car image.
 * e.g. "cars/clx123abc/1710000000000-0.jpg"
 */
export function imagePath(carId, index, mimeType) {
  const ext = mimeType === "image/png" ? "png"
            : mimeType === "image/webp" ? "webp"
            : "jpg";
  return `cars/${carId}/${Date.now()}-${index}.${ext}`;
}
