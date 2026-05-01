// src/app/layout.js
import "./globals.css";
import { CompareProvider } from "@/components/CompareContext";
import SiteChrome from "@/components/SiteChrome";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";
import { PWARegister } from "@/components/PWARegister";
import { getSession } from "@/lib/auth";
import CookieConsent from "@/components/CookieConsent";
import { headers } from "next/headers";

import { Playfair_Display } from "next/font/google";
import { getSiteOrigin } from "@/lib/site-url";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "Welsh Motorhub — Find Your Car in Kenya",
    template: "%s | Welsh Motorhub",
  },
  description:
    "Browse verified vehicles from trusted dealers across Kenya. Compare specs, duties, running costs, and contact dealers directly on Welsh Motorhub.",
  keywords: [
    "used cars Kenya",
    "cars for sale Kenya",
    "Welsh Motorhub",
    "car dealers Nairobi",
    "compare cars Kenya",
    "vehicle marketplace Kenya",
  ],
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
    title: "Welsh Motorhub — Find Your Car in Kenya",
    description:
      "Browse verified vehicles from trusted dealers across Kenya. Compare specs, costs, and contact dealers directly.",
    images: [{ url: "/newlogo.jpeg", width: 1200, height: 630, alt: "Welsh Motorhub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Welsh Motorhub — Find Your Car in Kenya",
    description:
      "Browse verified vehicles from trusted dealers across Kenya. Compare specs, costs, and contact dealers directly.",
    images: ["/newlogo.jpeg"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "96x96" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
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

  const session = await getSession();
  const user    = session?.user ? {
    id:      session.user.id,
    name:    session.user.name,
    email:   session.user.email,
    role:    session.user.role,
    avatarUrl: session.user.avatarUrl || null,
  } : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} bg-background text-slate-900 dark:text-white min-h-screen antialiased flex flex-col font-sans transition-colors duration-300`}>
        <PWARegister />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CompareProvider>
            <SiteChrome user={user} shellPath={shellPath}>
              {children}
            </SiteChrome>
          </CompareProvider>
          <ScrollToTop />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
