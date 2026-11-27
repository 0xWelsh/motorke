import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadImage, storagePublicOrigin } from "@/lib/storage";
import { ensurePrivateDealerFor } from "@/lib/private-seller";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * One photo per request. The client compresses to <=1600px JPEG first, so
 * each part is ~150-400KB — safe on mobile data, immune to the iOS Safari
 * multi-file FormData quirk, and no single request can hit the ingress
 * timeout. The listing itself is committed afterwards with these URLs.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ensured = await ensurePrivateDealerFor(user);
  if (ensured.error) return NextResponse.json({ error: ensured.error }, { status: 400 });

  const fd = await request.formData().catch(() => null);
  const file = fd?.get("photo");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No photo" }, { status: 400 });
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP" }, { status: 400 });
  }
  // Client already compressed; be generous but bounded.
  if (file.size > 6 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo too large (server limit 6MB — resend compressed)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const rand = Math.random().toString(36).slice(2, 8);
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  // cars/tmp-<userId>-... — the commit step verifies this ownership prefix.
  const path = `cars/tmp-${user.id}-${Date.now()}-${rand}.${ext}`;

  const url = await uploadImage(buffer, path, file.type);
  if (!url || !storagePublicOrigin() || !url.startsWith(`${storagePublicOrigin()}/`)) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
  return NextResponse.json({ url });
}
