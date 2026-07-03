import { NextResponse } from "next/server";
import { looksLikeCarListingId, looksLikeCarPublicSlug } from "@/lib/seo-car-slug";
import { SAVE_DATA_COOKIE } from "@/lib/save-data";

const SESSION_COOKIE = "welsh-motors_session";
const MAINT_BYPASS_COOKIE = "welsh-maint-bypass";
const ROTATION_COOKIE = "wmh-rot";
const ROTATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

function generateRotationId() {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function isMaintenanceOn() {
  const flag = (process.env.MAINTENANCE_MODE || "").toLowerCase().trim();
  return flag === "1" || flag === "on" || flag === "true" || flag === "yes";
}

// Paths that must keep working even when the site is in maintenance mode.
// Static assets, the maintenance page itself, the bypass endpoint, login,
// and the admin shell (so the team can still operate the system).
function isMaintenanceAllowed(pathname) {
  if (pathname === "/maintenance") return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname === "/login" || pathname === "/signup") return true;
  if (pathname === "/duty" || pathname.startsWith("/duty/")) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml" || pathname === "/BingSiteAuth.xml") {
    return true;
  }
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

  // Canonical public URLs like /cars/toyota internally render /cars/hub/toyota
  // (without changing the browser URL). Listing detail IDs stay on /cars/[id].
  if (request.method === "GET") {
    if (pathname.startsWith("/cars/hub")) {
      if (pathname === "/cars/hub" || pathname === "/cars/hub/") {
        const url = request.nextUrl.clone();
        url.pathname = "/cars";
        return NextResponse.redirect(url, 308);
      }
      const rest = pathname.slice("/cars/hub".length);
      const url = request.nextUrl.clone();
      url.pathname = `/cars${rest}`;
      return NextResponse.redirect(url, 308);
    }

    const twoSeg = pathname.match(/^\/cars\/([^/]+)\/([^/]+)\/?$/);
    if (twoSeg) {
      const a = twoSeg[1];
      if (!looksLikeCarListingId(a)) {
        const url = request.nextUrl.clone();
        url.pathname = `/cars/hub/${twoSeg[1]}/${twoSeg[2]}`;
        return NextResponse.rewrite(url);
      }
    } else {
      const oneSeg = pathname.match(/^\/cars\/([^/]+)\/?$/);
      if (oneSeg) {
        const a = oneSeg[1];
        if (a && !looksLikeCarListingId(a) && !looksLikeCarPublicSlug(a)) {
          const url = request.nextUrl.clone();
          url.pathname = `/cars/hub/${a}`;
          return NextResponse.rewrite(url);
        }
      }
    }
  }

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

  // Session-based route protection for /admin
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(SESSION_COOKIE);
    if (!session?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (request.headers.get("save-data") === "on") {
    response.cookies.set({
      name: SAVE_DATA_COOKIE,
      value: "1",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
  }

  // Issue a stable per-device rotation id used by the public /cars
  // listing to give every visitor their own deterministic shuffle.
  // No PII, just a random hex; rotates daily via the seed combiner.
  if (!request.cookies.get(ROTATION_COOKIE)?.value) {
    response.cookies.set({
      name: ROTATION_COOKIE,
      value: generateRotationId(),
      maxAge: ROTATION_COOKIE_MAX_AGE,
      sameSite: "lax",
      path: "/",
      secure: isProd,
      httpOnly: false,
    });
  }

  // Security Headers — apply CSP only on page routes (not API, to avoid breaking binary responses)
  if (!pathname.startsWith("/api/")) {
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
  }

  // Generic security headers — apply to all routes
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("Origin-Agent-Cluster", "?1");
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
    // Apply security headers to all routes (pages + API)
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
