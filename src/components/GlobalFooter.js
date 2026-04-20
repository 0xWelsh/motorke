"use client";

import { usePathname } from "next/navigation";

export default function GlobalFooter() {
  const pathname = usePathname() || "";
  
  if (pathname.startsWith("/portal") || pathname.startsWith("/admin") || pathname.startsWith("/account")) {
    return null;
  }

  return (
    <footer className="bg-[#f0f3f5] dark:bg-[#111111] pt-16 pb-6 px-6 sm:px-8 border-t border-[#e5e9ea] dark:border-slate-800 transition-all duration-300 ease-out" style={{ paddingBottom: 'max(3rem, calc(2rem + env(safe-area-inset-bottom)))' }}>
      <div className="container mx-auto max-w-[1440px]">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between gap-12 lg:gap-8 mb-16">
          {/* Left Column - Brand & Info */}
          <div className="md:w-5/12 xl:w-4/12 flex flex-col">
            <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-slate-900 dark:text-white mb-6">MOTORSKE</h2>
            
            <h3 className="text-2xl sm:text-[28px] font-serif text-[#1e293b] dark:text-white mb-4 leading-snug">
              Driving Kenya forward, one car at a time
            </h3>
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium mb-10 max-w-md">
              We connect you to trusted local dealerships directly, bridging the gap to bring you premium vehicles with transparent pricing, honest comparisons, and end-to-end support.
            </p>
            
            <div>
              <h4 className="text-[15px] font-serif text-[#1e293b] dark:text-white mb-3">Mailing Address</h4>
              <div className="flex items-start gap-2.5 text-slate-600 text-[13px] font-medium">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>00614 Wangige,<br/>Kabete</span>
              </div>
            </div>
          </div>

          {/* Middle Column - Links */}
          <div className="md:w-3/12 xl:w-2/12">
            <h4 className="text-[17px] font-serif text-[#1e293b] dark:text-white mb-6">Company</h4>
            <ul className="flex flex-col gap-4 text-[13px] font-medium text-slate-600">
              <li><a href="/about" className="hover:text-slate-900 dark:text-white transition-colors">About Us</a></li>
              <li><a href="/cars" className="hover:text-slate-900 dark:text-white transition-colors">Vehicles</a></li>
              <li><a href="/faq" className="hover:text-slate-900 dark:text-white transition-colors">FAQ</a></li>
              <li><a href="/blog" className="hover:text-slate-900 dark:text-white transition-colors">Blog</a></li>
              <li><a href="/contact" className="hover:text-slate-900 dark:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Right Column - Contact */}
          <div className="md:w-4/12 xl:w-3/12">
            <h4 className="text-[17px] font-serif text-[#1e293b] dark:text-white mb-6">Contact Us</h4>
            <div className="flex flex-col">
              <a href="https://wa.me/254717303587" className="flex items-center gap-3 py-3.5 border-b border-[#e2e6ea] text-[13px] font-medium text-slate-600 hover:text-slate-900 dark:text-white transition-colors">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                +254 717 303 587
              </a>
              <a href="mailto:sec@welsh.co.ke" className="flex items-center gap-3 py-3.5 border-b border-[#e2e6ea] text-[13px] font-medium text-slate-600 hover:text-slate-900 dark:text-white transition-colors">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                sec@welsh.co.ke
              </a>
              <a href="tel:+254717303587" className="flex items-center gap-3 py-3.5 border-b border-[#e2e6ea] text-[13px] font-medium text-slate-600 hover:text-slate-900 dark:text-white transition-colors">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                +254 717 303 587
              </a>
              
              {/* Social Icons */}
              <div className="flex gap-3 mt-6">
                <a href="https://www.facebook.com/share/1CK7WDu9ia/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-slate-600 hover:bg-[#cbd5e1] hover:text-slate-900 dark:text-white transition-all">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="https://www.instagram.com/_motorke" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-slate-600 hover:bg-[#cbd5e1] hover:text-slate-900 dark:text-white transition-all">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#e2e6ea] flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] font-medium text-slate-500">
          <p suppressHydrationWarning>&copy; {new Date().getFullYear()} MOTORSKE All rights reserved</p>
          <p>Designed with passion in <strong className="text-slate-800 dark:text-slate-200 font-black">Kenya</strong></p>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="hover:text-slate-900 dark:text-white underline underline-offset-2 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-900 dark:text-white underline underline-offset-2 transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
