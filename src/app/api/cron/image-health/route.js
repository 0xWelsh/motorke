// src/app/api/cron/image-health/route.js
// Daily Vercel cron. Samples up to N car_images.url rows, pings each one,
// and sends a system alert if the broken ratio exceeds a threshold OR if
// the R2 bucket itself is unreachable / credentials are missing.
//
// Triggered by Vercel at the schedule defined in vercel.json. Vercel adds
// the `x-vercel-cron` header on real cron requests; outside callers must
// present `Authorization: Bearer <CRON_SECRET>`.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSystemAlertEmail } from "@/lib/mail";
import { probeR2Bucket } from "@/lib/storage";

const SAMPLE_SIZE = 100;
const BROKEN_RATIO_THRESHOLD = 0.1; // alert when 10%+ of sampled images fail
const CONCURRENCY = 8;

async function probeBucket() {
  const probe = await probeR2Bucket();
  return { ok: probe.configured && probe.reachable, ...probe };
}

async function head(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 4000);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (!res.ok && (res.status === 405 || res.status === 400)) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { Range: "bytes=0-0" },
        signal: controller.signal,
      });
    }
    const ct = res.headers.get("content-type") || "";
    return {
      ok: (res.ok || res.status === 206) && (!ct || /^image\//i.test(ct)),
      status: res.status,
      contentType: ct || null,
    };
  } catch (err) {
    return { ok: false, status: 0, error: err?.name === "AbortError" ? "timeout" : "fetch_error" };
  } finally {
    clearTimeout(t);
  }
}

export async function GET(request) {
  const cronHeader = request.headers.get("x-vercel-cron");
  const authHeader = request.headers.get("authorization") || "";
  const expectedSecret = process.env.CRON_SECRET;

  // Allow Vercel cron, or a manual call with the right bearer token.
  if (!cronHeader && (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const startedAt = Date.now();
  const bucket = await probeBucket();

  // Random-ish sample: take the most recent SAMPLE_SIZE images. They
  // turn over the fastest and are the ones users are most likely to
  // see. A truly random sample would require ORDER BY random() which is
  // expensive on Postgres.
  const sample = await db.carImage.findMany({
    take: SAMPLE_SIZE,
    orderBy: { id: "desc" },
    select: { id: true, url: true },
  });

  const results = [];
  let i = 0;
  async function worker() {
    while (i < sample.length) {
      const idx = i++;
      const row = sample[idx];
      const probe = await head(row.url);
      results.push({ id: row.id, url: row.url, ...probe });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const broken = results.filter((r) => !r.ok);
  const brokenRatio = sample.length === 0 ? 0 : broken.length / sample.length;
  const statusBuckets = broken.reduce((acc, r) => {
    const key = r.status || (r.error || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  let alertReason = null;
  if (!bucket.ok) {
    alertReason = "bucket_unreachable";
  } else if (brokenRatio >= BROKEN_RATIO_THRESHOLD && sample.length >= 10) {
    alertReason = "broken_image_ratio";
  }

  if (alertReason) {
    await sendSystemAlertEmail({
      subject:
        alertReason === "bucket_unreachable"
          ? "R2 image bucket is unreachable"
          : `Car images broken (${Math.round(brokenRatio * 100)}%)`,
      summary:
        alertReason === "broken_image_ratio"
          ? `${broken.length} of ${sample.length} recently-uploaded car images are not serving as images. Visit /api/admin/diagnostics/images to inspect.`
          : bucket.configured === false
            ? "R2 credentials are missing (R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_PUBLIC_URL). Configure them in Vercel."
            : "The R2 image bucket health check failed (credentials invalid, bucket missing, or endpoint unreachable). Verify the R2_* environment variables in Vercel.",
      details: {
        sampled: sample.length,
        broken: broken.length,
        broken_ratio: `${(brokenRatio * 100).toFixed(1)}%`,
        bucket_reachable: bucket.reachable,
        bucket_configured: bucket.configured,
        bucket_status: bucket.status ?? null,
        broken_status_counts: statusBuckets,
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
      },
    });
  }

  return NextResponse.json(
    {
      ok: !alertReason,
      sampled: sample.length,
      broken: broken.length,
      brokenRatio,
      bucket,
      statusBuckets,
      alertReason,
      durationMs: Date.now() - startedAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
