// src/lib/storage.js
// Supabase Storage for car images
// Bucket name: "car-images" (create this in your Supabase dashboard)
//
// Dashboard → Storage → New bucket → name: "car-images" → Public: ON

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET          = "car-images";

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL.
 *
 * @param {Buffer} buffer     - File contents
 * @param {string} filename   - e.g. "cars/abc123/photo-0.jpg"
 * @param {string} mimeType   - e.g. "image/jpeg"
 */
export async function uploadImage(buffer, filename, mimeType) {
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
  await fetch(url, {
    method:  "DELETE",
    headers: { "Authorization": `Bearer ${SERVICE_KEY}` },
  }).catch(() => {});
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
