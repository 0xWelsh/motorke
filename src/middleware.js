import { NextResponse } from "next/server";

const SESSION_COOKIE = "welsh-motors_session";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === "production";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Session-based route protection ENABLED for /admin and /portal
  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
    const session = request.cookies.get(SESSION_COOKIE);
    if (!session?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Security Headers
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    `script-src 'self' 'unsafe-inline' ${isProd ? "" : "'unsafe-eval' "}*.google.com *.gstatic.com *.recaptcha.net *.cloudflare.com cdn.jsdelivr.net; ` +
    "style-src 'self' 'unsafe-inline' *.googleapis.com *.fontshare.com fonts.googleapis.com; " +
    "img-src 'self' data: blob: https: *.supabase.co *.unsplash.com *.openstreetmap.org tile.openstreetmap.org a.tile.openstreetmap.org b.tile.openstreetmap.org c.tile.openstreetmap.org; " +
    "font-src 'self' *.fontshare.com fonts.gstatic.com; " +
    "connect-src 'self' *.google.com *.gstatic.com *.recaptcha.net *.cloudflare.com *.supabase.co *.safaricom.co.ke vercel.com *.openstreetmap.org tile.openstreetmap.org a.tile.openstreetmap.org b.tile.openstreetmap.org c.tile.openstreetmap.org; " +
    "frame-src 'self' *.google.com *.recaptcha.net *.cloudflare.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Clickjacking protection
  response.headers.set("X-Frame-Options", "DENY");

  // XSS Protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("Origin-Agent-Cluster", "?1");

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=()"
  );

  // HSTS (only in production)
  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Protect all routes except static assets and api routes with own security
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
