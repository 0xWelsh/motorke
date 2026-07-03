// src/app/robots.js
import { getSiteOrigin } from "@/lib/site-url";

export default function robots() {
  const origin = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cars", "/dealers", "/compare", "/contact", "/faq", "/duty", "/mission", "/terms", "/privacy"],
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
