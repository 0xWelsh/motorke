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
  // Cloudflare Pages uses @opennextjs/cloudflare adapter
  // which handles the output format automatically
  // output: "standalone", // REMOVED for Cloudflare Pages

  images: {
    // Images served from Cloudflare R2 via public URL
    // Disable Next.js optimization to avoid quota limits
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "pub-**.r2.dev" },
      { protocol: "https", hostname: "images.bidgari.com" }, // Custom domain for R2
      { protocol: "https", hostname: "**" }, // Fallback for any external images
    ],
    dangerouslyAllowSVG: false,
  },

  // Prevent Prisma from being bundled into the server graph
  serverExternalPackages: ["@prisma/client", "prisma", "bcrypt", "sharp"],

  // A stray /home/welsh/package-lock.json makes Turbopack infer the monorepo
  // root one level above the app, which breaks file watching and caching.
  turbopack: { root: __dirname },

  // Static asset caching - Cloudflare CDN handles this at edge
  async headers() {
    const staticAssetCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];
    return [
      { source: "/images/:path*", headers: staticAssetCache },
      { source: "/logos/:path*", headers: staticAssetCache },
      { source: "/fonts/:path*", headers: staticAssetCache },
      { source: "/watermark/:path*", headers: staticAssetCache },
      // Uploaded car images served from R2 with long cache
      { source: "/uploads/:path*", headers: staticAssetCache },
    ];
  },

  // Allow network devices to connect to dev server for HMR
  allowedDevOrigins: ["192.168.0.111", "10.0.2.2"],

  // Experimental: Enable React 19 features
  experimental: {
    // ppr: 'incremental', // Partial Prerendering (optional)
  },
};

module.exports = nextConfig;