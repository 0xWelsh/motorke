// src/app/layout.js
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { CompareProvider } from "@/components/CompareContext";
import SiteChrome from "@/components/SiteChrome";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";
import { PWARegister } from "@/components/PWARegister";
import AnalyticsBootstrap from "@/components/AnalyticsBootstrap";
import { getSession } from "@/lib/auth";
import CookieConsent from "@/components/CookieConsent";
import { headers, cookies } from "next/headers";
import { SaveDataProvider } from "@/components/SaveDataProvider";
import { isSaveDataRequest, SAVE_DATA_COOKIE } from "@/lib/save-data";

import { Playfair_Display, DM_Sans } from "next/font/google";
import { BRAND_OG_IMAGE, getSiteOrigin } from "@/lib/site-url";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700"],
});

export const metadata = {
  metadataBase: new URL(getSiteOrigin()),
    title: {
      default: "Welsh Motorhub | Find Your Car in Kenya",
      template: "%s | Welsh Motorhub",
    },
    description:
      "Welsh Motorhub is Kenya's verified car marketplace. Browse dealer inventory across Nairobi, Mombasa, Kisumu and beyond. Compare specs, duties, and running costs, then contact dealers directly.",
    applicationName: "Welsh Motorhub",
    category: "automotive",
    keywords: [
      "Welsh Motorhub",
      "Welsh Motorhub Kenya",
      "Welsh Motors Kenya",
      "used cars Kenya",
      "cars for sale Kenya",
      "car dealers Nairobi",
      "car dealers Mombasa",
      "verified car dealers Kenya",
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
      title: "Welsh Motorhub",
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      locale: "en_KE",
      siteName: "Welsh Motorhub",
      url: getSiteOrigin(),
      title: "Welsh Motorhub | Find Your Car in Kenya",
      description:
        "Browse verified vehicles from trusted dealers across Kenya. Compare specs, costs, and contact dealers directly.",
      images: [{ url: BRAND_OG_IMAGE, width: 1200, height: 630, alt: "Welsh Motorhub" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Welsh Motorhub | Find Your Car in Kenya",
      description:
        "Browse verified vehicles from trusted dealers across Kenya. Compare specs, costs, and contact dealers directly.",
      images: [BRAND_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.png", type: "image/png", sizes: "96x96" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// Layout utilizes standard Helvetica stack for sans-serif

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }) {
  const headerList = await headers();
  const shellPath = headerList.get("x-pathname") || "/";
  const cookieStore = await cookies();
  const saveData =
    isSaveDataRequest(headerList) || cookieStore.get(SAVE_DATA_COOKIE)?.value === "1";

  const session = await getSession();
  const user    = session?.user ? {
    id:      session.user.id,
    name:    session.user.name,
    email:   session.user.email,
    role:    session.user.role,
    avatarUrl: session.user.avatarUrl || null,
  } : null;

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
    name: "Welsh Motorhub",
    legalName: "Welsh Motors Ltd",
    alternateName: ["Welsh Motors", "Welsh Motorhub Kenya"],
    url: origin,
    logo: `${origin}/headerlogo.png`,
    image: `${origin}${BRAND_OG_IMAGE}`,
    description:
      "Welsh Motorhub is Kenya's verified car marketplace connecting buyers with trusted dealers across the country.",
    areaServed: { "@type": "Country", name: "Kenya" },
    address: { "@type": "PostalAddress", addressCountry: "KE", addressLocality: "Nairobi" },
    ...(sameAs.length ? { sameAs } : {}),
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Welsh Motorhub",
    alternateName: "Welsh Motors",
    url: origin,
    inLanguage: "en-KE",
    publisher: { "@type": "Organization", name: "Welsh Motorhub" },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${origin}/cars?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Country / region signals for "Welsh Motorhub" vs Wales disambiguation in search */}
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
      </head>
      <body className={`${playfair.variable} ${dmSans.variable} bg-background text-slate-900 dark:text-white min-h-screen antialiased flex flex-col font-sans transition-colors duration-300`}>
        <PWARegister />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SaveDataProvider saveData={saveData}>
            <AnalyticsBootstrap />
            <CompareProvider>
              <SiteChrome user={user} shellPath={shellPath}>
                {children}
              </SiteChrome>
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
