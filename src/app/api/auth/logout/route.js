// src/app/api/auth/logout/route.js
import { destroySession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url));
}
