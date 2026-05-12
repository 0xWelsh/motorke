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
    // Allow any HTTPS image host. User uploads go through /api/upload to
    // Supabase Storage, but legacy listings and admin/dealer-pasted URLs
    // can originate from arbitrary CDNs (dealer websites, social hosts,
    // etc). Restricting to a fixed allowlist silently breaks those.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // Keep modern formats and a reasonable cache window so optimized
    // images don't get re-rendered on every request.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    dangerouslyAllowSVG: false,
  },
  // Prevent Prisma from being bundled into the server graph.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Allow network devices to connect to dev server for HMR
  allowedDevOrigins: ["192.168.0.111"],
};

module.exports = nextConfig;
