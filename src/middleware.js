import { NextResponse } from "next/server";

const SESSION_COOKIE = "welsh-motors_session";
const MAINT_BYPASS_COOKIE = "welsh-maint-bypass";

function isMaintenanceOn() {
  const flag = (process.env.MAINTENANCE_MODE || "").toLowerCase().trim();
  return flag === "1" || flag === "on" || flag === "true" || flag === "yes";
}

// Paths that must keep working even when the site is in maintenance mode.
// Static assets, the maintenance page itself, the bypass endpoint, login,
// and the admin/portal shells (so the team can still operate the system).
function isMaintenanceAllowed(pathname) {
  if (pathname === "/maintenance") return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/portal")) return true;
  if (pathname === "/login" || pathname === "/signup") return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (pathname === "/manifest.json" || pathname === "/manifest.webmanifest") return true;
  if (/^\/(favicon|icon|apple-icon|android-chrome|logo|brand)/i.test(pathname)) return true;
  if (/\.(?:png|jpe?g|gif|svg|webp|avif|ico|css|js|map|txt|xml|json|woff2?|ttf|otf)$/i.test(pathname)) {
    return true;
  }
  return false;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === "production";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Maintenance mode: rewrite everything user-facing to /maintenance.
  // Admin/portal sessions and a one-shot bypass cookie can still access
  // the live site so the team can keep working.
  if (isMaintenanceOn() && !isMaintenanceAllowed(pathname)) {
    const hasBypass = request.cookies.get(MAINT_BYPASS_COOKIE)?.value === "1";
    const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;
    if (!hasBypass && !hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      const res = NextResponse.rewrite(url);
      res.headers.set("Cache-Control", "no-store");
      res.headers.set("Retry-After", "300");
      return res;
    }
  }

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
    // Pages only — skip /api so binary routes (e.g. PDF) are not wrapped by page CSP / header pass-through quirks
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
