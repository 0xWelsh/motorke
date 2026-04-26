// src/app/layout.js
import "./globals.css";
import { CompareProvider } from "@/components/CompareContext";
import Navbar from "@/components/Navbar";
import { CompareBar } from "@/components/CompareSelector";
import { ModalProvider } from "@/components/Modal";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";
import { PWARegister } from "@/components/PWARegister";
import { getSession } from "@/lib/auth";
import CookieConsent from "@/components/CookieConsent";

import { Playfair_Display } from "next/font/google";
import GlobalFooter from "@/components/GlobalFooter";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Welsh Motors — Find Your Car in Kenya",
  description: "Compare cars from top dealerships across Kenya on Welsh Motors.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
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
};

export default async function RootLayout({ children }) {
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
            <Navbar user={user} />
            <ModalProvider>
              <main className="flex-1">{children}</main>
              <CompareBar />
            </ModalProvider>
          </CompareProvider>
          <GlobalFooter />
          <ScrollToTop />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
