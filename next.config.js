// next.config.js
// Validate environment variables at build/start time
const { validateEnv } = require('./src/lib/validate-env');
try {
  validateEnv({ strict: process.env.NODE_ENV === "production" });
} catch (error) {
  console.error(error.message);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // We serve all car images from Supabase Storage, which already provides
    // a CDN with caching. Routing them through Vercel's /_next/image
    // optimizer hits the Hobby-plan image-optimization quota (402 Payment
    // Required) once a site has many listings. Disable optimization so
    // <Image> falls back to a plain <img> tag pointing straight at the
    // source URL — no quota, no extra hop, same render result.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    dangerouslyAllowSVG: false,
  },
  // Prevent Prisma from being bundled into the server graph.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Vercel serves `public/` files with `max-age=0, must-revalidate` by
  // default, so every logo/background/model image is revalidated on each
  // visit. These assets change rarely; a day of browser cache plus a week of
  // stale-while-revalidate removes that round-trip without pinning stale art.
  async headers() {
    const staticAssetCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=86400, stale-while-revalidate=604800",
      },
    ];
    return [
      { source: "/images/:path*", headers: staticAssetCache },
      { source: "/logos/:path*", headers: staticAssetCache },
      { source: "/fonts/:path*", headers: staticAssetCache },
      { source: "/uploads/:path*", headers: staticAssetCache },
      { source: "/signup/:path*", headers: staticAssetCache },
      { source: "/watermark/:path*", headers: staticAssetCache },
    ];
  },
  // Allow network devices to connect to dev server for HMR
  allowedDevOrigins: ["192.168.0.111", "10.0.2.2"],
  // Android emulator uses 10.0.2.2 to reach host localhost
};

module.exports = nextConfig;
