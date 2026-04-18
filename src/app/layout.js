// src/app/layout.js
import { Work_Sans, Inter } from "next/font/google";
import "./globals.css";
import { CompareProvider } from "@/components/CompareContext";
import Navbar from "@/components/Navbar";
import { CompareBar } from "@/components/CompareSelector";
import { ModalProvider } from "@/components/Modal";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";
import { PWARegister } from "@/components/PWARegister";
import { getSession } from "@/lib/auth";

import GlobalFooter from "@/components/GlobalFooter";

export const metadata = {
  title: "Motorke — Find Your Car in Kenya",
  description: "Compare cars from top dealerships across Kenya.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/headerlogo.png", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
  },
};

const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans", display: "swap", weight: ["400", "500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

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
    <html lang="en" suppressHydrationWarning className={`${workSans.variable} ${inter.variable}`}>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
