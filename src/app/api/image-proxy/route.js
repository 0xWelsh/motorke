import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
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
