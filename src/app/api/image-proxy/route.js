import { NextResponse } from "next/server";

export async function GET(request) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const response = await fetch(url);
  const blob = await response.blob();

  return new NextResponse(blob, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
