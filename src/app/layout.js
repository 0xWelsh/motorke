// src/app/layout.js
import "./globals.css";
import { CompareProvider } from "@/components/CompareContext";
import Navbar from "@/components/Navbar";
import { CompareBar } from "@/components/CompareSelector";
import { ModalProvider } from "@/components/Modal";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Motorke — Find Your Car in Kenya",
  description: "Compare cars from top dealerships across Kenya.",
  icons: {
    icon: "/favicon.png",
  },
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
      <body className="bg-background text-slate-900 min-h-screen antialiased flex flex-col font-sans">
        <CompareProvider>
          <Navbar user={user} />
          <ModalProvider>
            <main className="flex-1">{children}</main>
            <CompareBar />
          </ModalProvider>
        </CompareProvider>
        <footer className="mt-20 border-t border-slate-200 bg-white py-12 px-6">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
              <img src="/logo.png" alt="Motorke" className="h-8 w-auto object-contain mb-2" />
              <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">The Standard for Kenyan Automotive.</p>
            </div>
            <div className="flex gap-8">
              {[["Showcase", "/cars"], ["Dealerships", "/dealers"], ["Duty Calculator", "/duty"]].map(([label, href]) => (
                <a key={href} href={href} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">{label}</a>
              ))}
            </div>
          </div>
          <div className="container mx-auto max-w-7xl mt-12 pt-8 border-t border-slate-100 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-300 mb-4 md:mb-0">
              <span suppressHydrationWarning>{new Date().getFullYear()}</span> Motorke Secondary Marketplace
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-300 hover:text-slate-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.224-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
