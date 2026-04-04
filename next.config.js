// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Seed data placeholder images
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.motor1.com" },
      // Supabase Storage (replace project ref wildcard with yours for tighter security)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  // Prevent Prisma from being bundled into the server graph.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Allow network devices to connect to dev server for HMR
  allowedDevOrigins: ["192.168.0.111"],
};

module.exports = nextConfig;
