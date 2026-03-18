// src/app/robots.js
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow:     ["/", "/cars", "/dealers", "/compare"],
        disallow:  ["/admin", "/portal", "/login", "/api", "/dashboard"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://motorke.co.ke"}/sitemap.xml`,
  };
}
