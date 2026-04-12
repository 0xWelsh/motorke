// src/app/layout.js
import "./globals.css";
import { CompareProvider } from "@/components/CompareContext";
import Navbar from "@/components/Navbar";
import { CompareBar } from "@/components/CompareSelector";
import { ModalProvider } from "@/components/Modal";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Motorke — Find Your Car in Kenya",
  description: "Compare cars from top dealerships across Kenya.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      <body className="bg-background text-slate-900 min-h-screen antialiased flex flex-col font-sans transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CompareProvider>
            <Navbar user={user} />
            <ModalProvider>
              <main className="flex-1">{children}</main>
              <CompareBar />
            </ModalProvider>
          </CompareProvider>
          <footer className="mt-20 border-t border-slate-200 bg-white py-12 px-6 transition-all duration-300 ease-out">
            <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center md:items-start">
                <span className="mk-logo-shell mk-logo-shell-sm mb-2">
                  <img src="/favicon.svg" alt="Motorke" className="mk-logo-img" />
                </span>
                <p className="text-slate-500 text-xs mt-1 font-semibold tracking-wide">Cars first. Dealers visible. Buyers confident.</p>
              </div>
              <div className="flex gap-8 flex-wrap justify-center">
                {[ ["Showcase", "/cars"], ["Dealers", "/dealers"], ["Duty Calculator", "/duty"], ["Terms", "/terms"], ["Privacy", "/privacy"]].map(([label, href]) => (
                  <a key={href} href={href} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">{label}</a>
                ))}
              </div>
            </div>
            <div className="container mx-auto max-w-7xl mt-12 pt-8 border-t border-slate-100 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4 md:mb-0">
                <span suppressHydrationWarning>{new Date().getFullYear()}</span> Motorke Marketplace
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-slate-700 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.224-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
              </div>
            </div>
          </footer>
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
