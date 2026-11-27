import { NextResponse } from "next/server";
import { looksLikeCarListingId, looksLikeCarPublicSlug, SEO_COUNTIES } from "@/lib/seo-car-slug";

const COUNTY_SLUGS = new Set(
  SEO_COUNTIES.map((c) => c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")),
);

const SESSION_COOKIE = "welsh-motors_session";
const MAINT_BYPASS_COOKIE = "welsh-maint-bypass";

// Allowed origins for CSRF validation (defense-in-depth).
// In production, only the canonical site origin is permitted.
function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : null,
  ].filter(Boolean);
  // Strip trailing slashes for comparison
  const normOrigin = origin.replace(/\/+$/, "");
  return allowed.some((a) => a && normOrigin === a.replace(/\/+$/, ""));
}

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Hoisted to module scope: this ~1.2KB string was previously rebuilt by string
// concatenation on every request, and middleware runs on every RSC payload
// fetch — i.e. on every client navigation.
const CSP_PROD =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' *.google.com *.gstatic.com *.recaptcha.net *.cloudflare.com *.cloudflareinsights.com cdn.jsdelivr.net; " +
  "style-src 'self' 'unsafe-inline' *.googleapis.com *.fontshare.com fonts.googleapis.com; " +
  "img-src 'self' data: blob: https: *.supabase.co *.r2.dev *.unsplash.com *.openstreetmap.org tile.openstreetmap.org a.tile.openstreetmap.org b.tile.openstreetmap.org c.tile.openstreetmap.org; " +
  "font-src 'self' *.fontshare.com fonts.gstatic.com; " +
  "connect-src 'self' *.google.com *.gstatic.com *.recaptcha.net *.cloudflare.com *.cloudflareinsights.com *.supabase.co *.r2.dev *.safaricom.co.ke vercel.com *.openstreetmap.org tile.openstreetmap.org a.tile.openstreetmap.org b.tile.openstreetmap.org c.tile.openstreetmap.org; " +
  "frame-src 'self' *.google.com *.recaptcha.net *.cloudflare.com; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self';";

// Same policy plus 'unsafe-eval', which Next's dev overlay requires.
const CSP_DEV = CSP_PROD.replace(
  "script-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
);

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "Origin-Agent-Cluster": "?1",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",
};

const HSTS_HEADER = "max-age=31536000; includeSubDomains; preload";

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

let liveSetCache = { at: 0, data: null };

async function fetchLiveSet() {
  const now = Date.now();
  if (liveSetCache.data && now - liveSetCache.at < 10_000) return liveSetCache.data;
  try {
    // Hit our own container directly — going out via the public origin adds
    // a Cloudflare round trip and always misses the budget.
    const port = process.env.PORT || 3000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://127.0.0.1:${port}/api/internal/live-slugs`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.ok) liveSetCache = { at: now, data: await res.json() };
  } catch {
    /* fail open: keep serving stale, or fall through to the page */
  }
  return liveSetCache.data;
}

async function deadSlugRedirect(request, slug) {
  const live = await fetchLiveSet();
  if (!live || live.slugs.includes(slug)) return null;
  const rest = slug.split("-").slice(1).join("-");
  const make = live.makes
    .filter((m) => rest === m || rest.startsWith(`${m}-`))
    .sort((a, b) => b.length - a.length)[0];
  if (!make) return null;
  const url = request.nextUrl.clone();
  url.pathname = `/cars/${make}`;
  return NextResponse.redirect(url, 308);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === "production";

  // Retired domains → permanent redirect to bidgari.com. Runs at the edge
  // BEFORE caching, so this covers every path including stale prerenders.
  if (isProd) {
    const host = (request.headers.get("host") || "").toLowerCase();
    if (host === "welshmotorhub.co.ke" || host === "www.welshmotorhub.co.ke") {
      const target = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://bidgari.com");
      return NextResponse.redirect(target, 308);
    }
  }

  // CSRF defense-in-depth: if a mutating request includes an Origin or Referer
  // header, validate it matches the site origin. Same-origin requests always
  // send these headers; cross-origin requests without SameSite=Lax cookie are
  // blocked by the browser. This catches script-based attacks that forge headers.
  if (!CSRF_SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const candidate = origin || referer || "";
    if (candidate && !isAllowedOrigin(candidate)) {
      return new NextResponse(JSON.stringify({ error: "CSRF validation failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

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
        // Dead listing slug (year-first public slug that no longer exists):
        // 308 to the matching make hub. Must happen HERE, not in the page —
        // the layout's Suspense boundary flushes the shell before the page
        // resolves, which would downgrade a page-level redirect to a
        // client-side 200. The live-set lookup is module-cached (10s) and
        // fails open.
        if (a && looksLikeCarPublicSlug(a)) {
          const decision = await deadSlugRedirect(request, a);
          if (decision) return decision;
        }
      }
    }
  }

  // Legacy county URLs: /kenya/nairobi & friends were advertised before the
  // county hubs actually lived under /cars/<county>. 301 them so old links
  // and crawl equity land on the real page instead of a 404.
  if (pathname.startsWith("/kenya/")) {
    const seg = decodeURIComponent(pathname.slice(7)).toLowerCase();
    if (seg && !seg.includes("/") && COUNTY_SLUGS.has(seg)) {
      const url = request.nextUrl.clone();
      url.pathname = `/cars/${seg}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // /u/<handle>: unknown or private profiles must return a REAL 404.
  // In-page notFound() would stream as a 200 soft-404 (layout Suspense
  // locks the status), so decide here against the cached live set.
  if (pathname.startsWith("/u/") && isProd) {
    const h = decodeURIComponent(pathname.slice(3)).toLowerCase();
    if (h && !h.includes("/")) {
      const live = await fetchLiveSet();
      if (live?.handles && !live.handles.includes(h)) {
        const url = request.nextUrl.clone();
        url.pathname = "/_not-found";
        return NextResponse.rewrite(url, { status: 404 });
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

  // No cookies are set here on purpose. A Set-Cookie header makes Vercel's
  // CDN (and RFC-compliant shared caches) skip caching the whole response, so
  // per-device state (rotation id, save-data) is issued by API routes instead.
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Security Headers — apply CSP only on page routes (not API, to avoid breaking binary responses)
  if (!pathname.startsWith("/api/")) {
    response.headers.set("Content-Security-Policy", isProd ? CSP_PROD : CSP_DEV);
  }

  // Generic security headers — apply to all routes
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  // HSTS (only in production)
  if (isProd) {
    response.headers.set("Strict-Transport-Security", HSTS_HEADER);
  }

  return response;
}

export const config = {
  // Run on pages and APIs, but not on static assets. Those don't need CSP or
  // session checks, and skipping them avoids a middleware invocation for every
  // image, font and stylesheet request.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|uploads/|logos/|fonts/|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|css|js|mjs|map|txt|xml|json|webmanifest|woff2?|ttf|otf)$).*)",
  ],
};
