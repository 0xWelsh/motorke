// src/middleware.js
// Protects /admin and /portal at the edge before any page renders.
// We only check cookie presence here — full session validation happens
// inside each page via requireAdmin() / requireDealer().

import { NextResponse } from "next/server";

const SESSION_COOKIE = "motorke_session";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE);

  // If no session cookie at all, redirect to login
  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all /admin and /portal routes
  matcher: ["/admin/:path*", "/portal/:path*"],
};
