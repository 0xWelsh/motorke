// src/app/api/health/route.js
// Public health check. Probes the systems that the site depends on so
// external monitors (UptimeRobot, BetterStack, etc.) can alert when one
// of them is degraded. Designed to be cheap enough to ping every minute.
//
// Returns 200 with `{ ok: true, checks: {...} }` when healthy.
// Returns 503 with `{ ok: false, checks: {...} }` when any critical
// dependency is failing. Each check has its own boolean so monitors can
// surface which subsystem broke.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { probeR2Bucket } from "@/lib/storage";
import { getQueryHealth } from "@/lib/query-monitor";

async function checkDatabase() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || "db_unreachable" };
  }
}

async function checkBucket() {
  const probe = await probeR2Bucket();
  return {
    ok: probe.configured && probe.reachable,
    reachable: probe.reachable,
    configured: probe.configured,
    bucket: probe.name,
    error: probe.configured && !probe.reachable ? "bucket_unreachable" : undefined,
  };
}

async function checkSampleImage() {
  // Pick one recent image from the DB and confirm it responds with image bytes.
  // This catches the exact failure mode we just had (CDN/optimizer returning
  // a non-image response while the bucket itself looks fine).
  const sample = await db.carImage
    .findFirst({ orderBy: { id: "desc" }, select: { url: true } })
    .catch(() => null);
  if (!sample?.url) return { ok: true, skipped: "no_images" };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(sample.url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      signal: controller.signal,
    });
    const ct = res.headers.get("content-type") || "";
    const looksLikeImage = /^image\//i.test(ct);
    return {
      ok: (res.ok || res.status === 206) && looksLikeImage,
      status: res.status,
      contentType: ct || null,
    };
  } catch (err) {
    return { ok: false, error: err?.name === "AbortError" ? "timeout" : "fetch_error" };
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const started = Date.now();
  const [database, bucket, sampleImage, queryHealth] = await Promise.all([
    checkDatabase(),
    checkBucket(),
    checkSampleImage(),
    getQueryHealth(),
  ]);

  const checks = { database, bucket, sampleImage };
  const ok = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      ok,
      service: "welsh-motorhub",
      checks,
      queryHealth,
      durationMs: Date.now() - started,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
      region: process.env.VERCEL_REGION || null,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
}
