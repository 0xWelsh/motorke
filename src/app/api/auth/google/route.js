import { NextResponse } from "next/server";

export async function POST(request) {
  return NextResponse.json(
    { error: "Google authentication is temporarily disabled" },
    { status: 503 }
  );
}
