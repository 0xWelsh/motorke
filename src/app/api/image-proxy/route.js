import { NextResponse } from "next/server";
import { imageHost } from "@/lib/image-host";

const ALLOWED_IMAGE_HOSTS = [
  // The live bucket (from R2_PUBLIC_URL), so a custom domain is covered too.
  imageHost(),
  "r2.dev",
  "supabase.co",
  "supabase.in",
  "imgbb.com",
  "images.unsplash.com",
  "i.ibb.co",
  "postimg.cc",
].filter(Boolean);

function isAllowedImageUrl(urlString) {
  let host;
  try {
    host = new URL(urlString).hostname;
  } catch {
    return false;
  }
  return ALLOWED_IMAGE_HOSTS.some((allowed) => host === allowed || host.endsWith("." + allowed));
}

export async function GET(request) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    if (!isAllowedImageUrl(url)) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: 502 }
      );
    }

    const blob = await response.blob();

    return new NextResponse(blob, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Proxy fetch failed" },
      { status: 502 }
    );
  }
}
