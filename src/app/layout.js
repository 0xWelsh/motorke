// src/app/layout.js
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { CompareProvider } from "@/components/CompareContext";
import SiteChrome from "@/components/SiteChrome";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";
import { PWARegister } from "@/components/PWARegister";
import AnalyticsBootstrap from "@/components/AnalyticsBootstrap";
import { getBrowseInventoryCounts } from "@/lib/browse-inventory-counts";
import CookieConsent from "@/components/CookieConsent";
import { SaveDataProvider } from "@/components/SaveDataProvider";
import PageTransition from "@/components/PageTransition";
import PendingSwap from "@/components/PendingSwap";
import CarDetailSkeleton from "@/components/CarDetailSkeleton";
import { CarNavPendingProvider } from "@/components/CarNavPending";
import { Suspense } from "react";
import { Lato, Montserrat } from "next/font/google";

import { BRAND_HEADER_LOGO, BRAND_OG_IMAGE, getSiteOrigin } from "@/lib/site-url";
import { IMAGE_BASE_URL } from "@/lib/image-host";

// Empty when R2_PUBLIC_URL is unset — the preconnect is simply skipped rather
// than rendering a broken href.
const IMAGE_ORIGIN = IMAGE_BASE_URL
  ? IMAGE_BASE_URL.replace(/\/+$/, "").replace(/^(https?:\/\/[^/]+).*$/, "$1")
  : "";

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(getSiteOrigin()),
    title: {
      default: "BIDGARI | Find Your Car in Kenya",
      template: "%s | BIDGARI",
    },
    description:
      "BIDGARI is Kenya's verified car marketplace. Browse verified inventory across Nairobi, Mombasa, Kisumu and beyond. Compare specs, duties, and running costs, then buy handled end-to-end by BIDGARI.",
    applicationName: "BIDGARI",
    category: "automotive",
    keywords: [
      "used cars Kenya",
      "cars for sale Kenya",
      "used cars Nairobi",
      "used cars Mombasa",
      "buy cars online Kenya",
      "compare cars Kenya",
      "vehicle marketplace Kenya",
    ],
    alternates: {
      canonical: "/",
    },
    verification: {
      ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
        ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? {
            other: {
              "msvalidate.01": [process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION],
            },
          }
        : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    manifest: "/manifest.json",
      appleWebApp: {
      capable: true,
      title: "BIDGARI",
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      locale: "en_KE",
      siteName: "BIDGARI",
      url: getSiteOrigin(),
      title: "BIDGARI | Find Your Car in Kenya",
      description:
        "Browse verified cars for sale across Kenya — Toyota, Subaru, BMW and more. Transparent prices, mileage and specs on every listing, and every sale handled end-to-end by BIDGARI.",
      images: [{ url: BRAND_OG_IMAGE, width: 1200, height: 630, alt: "BIDGARI" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "BIDGARI | Find Your Car in Kenya",
      description:
        "Browse verified cars for sale across Kenya — Toyota, Subaru, BMW and more. Transparent prices, mileage and specs on every listing, and every sale handled end-to-end by BIDGARI.",
      images: [BRAND_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "48x48" },
      { url: "/favicon.png?v=3", type: "image/png", sizes: "96x96" },
      { url: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico?v=3" }],
    apple: [{ url: "/icon-192.png?v=3", sizes: "180x180", type: "image/png" }],
  },
};

// Layout utilizes standard Helvetica stack for sans-serif

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom on the page itself is switched off. Browsers keep resizing the
  // viewport when a pinch gesture starts anywhere outside an element with its
  // own touch-action, which on a listing page drags the price and the photo
  // off-screen and leaves the reader zoomed in. In-page content stays
  // horizontally swipeable because the gallery opts into that gesture.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f6f6f4",
};

export default async function RootLayout({ children }) {
  // IMPORTANT: no headers()/cookies()/getSession() here. Reading them in the
  // root layout opts every route into per-request dynamic rendering and
  // silently disables `revalidate` (ISR + CDN HTML caching) everywhere.
  // Nav counts are cached, and auth + save-data resolve client-side instead.
  const navCounts = await getBrowseInventoryCounts();

  const origin = getSiteOrigin();
  const sameAs = [
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
    process.env.NEXT_PUBLIC_SOCIAL_TIKTOK,
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN,
    process.env.NEXT_PUBLIC_SOCIAL_X,
  ].filter(Boolean);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BIDGARI",
    legalName: "BIDGARI Ltd",
    alternateName: ["BIDGARI Kenya"],
    url: origin,
    logo: `${origin}${BRAND_HEADER_LOGO}`,
    image: `${origin}${BRAND_OG_IMAGE}`,
    description:
      "BIDGARI is Kenya's verified car marketplace, with one trusted team handling every sale for buyers across the country.",
    areaServed: { "@type": "Country", name: "Kenya" },
    address: { "@type": "PostalAddress", addressCountry: "KE", addressLocality: "Nairobi" },
    ...(sameAs.length ? { sameAs } : {}),
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BIDGARI",
    alternateName: "BIDGARI",
    url: origin,
    inLanguage: "en-KE",
    publisher: { "@type": "Organization", name: "BIDGARI" },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${origin}/cars?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "BIDGARI",
    description: "Kenya's verified car marketplace — every car verified, every sale handled.",
    url: origin,
    logo: `${origin}${BRAND_HEADER_LOGO}`,
    image: `${origin}${BRAND_OG_IMAGE}`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "KE",
      addressLocality: "Nairobi",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -1.2921,
      longitude: 36.8219,
    },
    areaServed: { "@type": "Country", name: "Kenya" },
    priceRange: "$$",
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to image CDNs for faster loading */}
        <link rel="preconnect" href="https://bbseolknavwpjzvotdct.supabase.co" />
        {IMAGE_ORIGIN && <link rel="preconnect" href={IMAGE_ORIGIN} />}
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Country / region signals for "BIDGARI" vs Wales disambiguation in search */}
        <meta name="geo.region" content="KE" />
        <meta name="geo.placename" content="Nairobi, Kenya" />
        <meta name="ICBM" content="-1.2921, 36.8219" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
        />
      </head>
      <body className={`${lato.variable} ${montserrat.variable} bg-background text-slate-800 min-h-screen antialiased flex flex-col font-sans`}>
        <PWARegister />
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <SaveDataProvider>
            {/* useSearchParams inside a statically-prerendered page needs a
                Suspense boundary, else the whole page bails to CSR at build. */}
            <Suspense fallback={null}>
              <AnalyticsBootstrap />
            </Suspense>
<CompareProvider>
              <CarNavPendingProvider>
                <SiteChrome navCounts={navCounts}>
                  <PageTransition>
                    <PendingSwap fallback={<CarDetailSkeleton />}>
                      {children}
                    </PendingSwap>
                  </PageTransition>
                </SiteChrome>
              </CarNavPendingProvider>
            </CompareProvider>
          </SaveDataProvider>
          <ScrollToTop />
          <CookieConsent />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
