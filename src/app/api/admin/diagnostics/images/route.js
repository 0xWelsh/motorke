// src/app/api/admin/diagnostics/images/route.js
// Admin-only image health check. Pings every car_images.url with HEAD and
// reports which ones are dead. Also probes the R2 bucket directly to
// distinguish "the whole project is down" from "a few orphan URLs".

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { probeR2Bucket } from "@/lib/storage";

async function headOnce(url, timeoutMs = 4000) {
  if (!url || typeof url !== "string") return { ok: false, status: 0, reason: "empty" };
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    // Some hosts (incl. Supabase Storage in certain configs) don't return
    // useful info for HEAD. Fall back to a tiny GET if HEAD looks broken.
    if (!res.ok && (res.status === 405 || res.status === 400)) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { Range: "bytes=0-0" },
        signal: controller.signal,
      });
    }
    return {
      ok: res.ok || res.status === 206,
      status: res.status,
      contentType: res.headers.get("content-type") || null,
    };
  } catch (err) {
    return { ok: false, status: 0, reason: err?.name === "AbortError" ? "timeout" : "fetch_error" };
  } finally {
    clearTimeout(t);
  }
}

async function probeBucket() {
  const probe = await probeR2Bucket();
  return {
    configured: probe.configured,
    reachable: probe.reachable,
    name: probe.name,
    error: probe.error ?? null,
    status: probe.status ?? null,
  };
}

export async function GET(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "300", 10), 1), 2000);
  const concurrency = Math.min(Math.max(parseInt(url.searchParams.get("concurrency") || "8", 10), 1), 16);

  const bucket = await probeBucket();

  const images = await db.carImage.findMany({
    take: limit,
    orderBy: { id: "desc" },
    select: {
      id: true,
      url: true,
      car: { select: { id: true, make: true, model: true, year: true, dealerId: true, dealer: { select: { name: true, phone: true } } } },
    },
  });

  const results = [];
  let i = 0;
  async function worker() {
    while (i < images.length) {
      const idx = i++;
      const img = images[idx];
      const probe = await headOnce(img.url);
      const looksLikeImage = !probe.contentType || /^image\//i.test(probe.contentType);
      results.push({
        imageId: img.id,
        url: img.url,
        car: img.car
          ? {
              id: img.car.id,
              title: `${img.car.year} ${img.car.make} ${img.car.model}`,
              dealer: img.car.dealer?.name || null,
              dealerPhone: img.car.dealer?.phone || null,
            }
          : null,
        ok: probe.ok && looksLikeImage,
        status: probe.status,
        contentType: probe.contentType,
        reason: probe.reason,
      });
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const broken = results.filter((r) => !r.ok);
  const brokenByCar = new Map();
  for (const r of broken) {
    if (!r.car) continue;
    if (!brokenByCar.has(r.car.id)) {
      brokenByCar.set(r.car.id, { ...r.car, brokenImageIds: [], statuses: new Set() });
    }
    const entry = brokenByCar.get(r.car.id);
    entry.brokenImageIds.push(r.imageId);
    entry.statuses.add(r.status);
  }

  return NextResponse.json(
    {
      bucket,
      scanned: results.length,
      brokenCount: broken.length,
      brokenSampleStatuses: Array.from(new Set(broken.map((r) => r.status))).slice(0, 10),
      brokenCars: Array.from(brokenByCar.values()).map((c) => ({
        ...c,
        statuses: Array.from(c.statuses),
      })),
      hint: bucket.reachable === false
        ? bucket.configured === false
          ? "R2 credentials are missing (R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_PUBLIC_URL). Configure them in Vercel."
          : "R2 bucket is not reachable. Likely rotated R2 credentials, missing bucket, or invalid endpoint."
        : broken.length > 0
          ? "Bucket is reachable but some object paths are missing or returned non-image responses. Likely cleaned up or never finished uploading."
          : "All sampled images responded with image content. No action needed.",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// POST: delete the carImage rows that the GET scan flagged as broken.
// Pass { imageIds: ["..."] } in the body. We never delete from storage here;
// only the DB rows are removed so the listing falls back to the placeholder.
export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body?.imageIds)
    ? body.imageIds.filter((v) => typeof v === "string" && v.length > 0).slice(0, 1000)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "imageIds required" }, { status: 400 });
  }

  const deleted = await db.carImage.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ deleted: deleted.count });
}
