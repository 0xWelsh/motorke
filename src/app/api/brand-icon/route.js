import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getBrandIconSource } from "@/lib/brand-icon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readPublicFile(name) {
  const buf = await readFile(join(process.cwd(), "public", name));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

export async function GET() {
  const source = await getBrandIconSource();
  if (source?.url) {
    try {
      const res = await fetch(source.url, { cache: "no-store" });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        return new NextResponse(buf, {
          headers: {
            "Content-Type": source.contentType || res.headers.get("content-type") || "image/png",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        });
      }
    } catch {
      /* fall through to static favicon */
    }
  }

  try {
    return await readPublicFile("favicon.png");
  } catch {
    return new NextResponse("Icon unavailable", { status: 404 });
  }
}
