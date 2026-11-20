// src/app/robots.js
import { getSiteOrigin } from "@/lib/site-url";

export default function robots() {
  const origin = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/cars",
          "/compare",
          "/contact",
          "/faq",
          "/duty",
          "/mission",
          "/terms",
          "/privacy",
          "/blog",
          "/guides",
          "/kenya",
          "/luxury",
          "/safety",
          "/report",
          "/testimonials",
          "/how-to-buy",
          "/trust",
          "/sell",
          "/requests",
          "/request-car",
        ],
        disallow: [
          "/admin",
          "/login",
          "/signup",
          "/verify",
          "/forgot-password",
          "/reset-password",
          "/api",
          "/dashboard",
          "/account",
        ],
      },
    ],
    host: origin,
    sitemap: `${origin}/sitemap.xml`,
  };
}
