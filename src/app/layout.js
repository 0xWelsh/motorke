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

import GlobalFooter from "@/components/GlobalFooter";

export const metadata = {
  title: "Motorke — Find Your Car in Kenya",
  description: "Compare cars from top dealerships across Kenya.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

// Removed Google Fonts here to utilize standard Helvetica stack

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
  } : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-slate-900 dark:text-white min-h-screen antialiased flex flex-col font-sans transition-colors duration-300">
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
