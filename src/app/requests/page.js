import Link from "next/link";
import BuyerRequestBoard from "@/components/buyer-requests/BuyerRequestBoard";
import { absoluteUrl } from "@/lib/site-url";

export const metadata = {
  title: "Open Car Requests",
  description: "Browse live buyer car requests in Kenya and send offers on WhatsApp.",
  alternates: { canonical: "/requests" },
  robots: { index: true, follow: true },
  openGraph: {
    url: absoluteUrl("/requests"),
    title: "Open Car Requests | Welsh Motorhub",
  },
};

export default function BuyerRequestsBoardPage() {
  return (
    <div className="min-h-screen bg-[#f4f7f5] dark:bg-[#0a0a0a]">
      <section className="relative overflow-hidden border-b border-emerald-100/80 dark:border-emerald-950/40 pt-14 sm:pt-16 pb-5 sm:pb-6 px-4 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,161,105,0.12),transparent_55%)]"
          aria-hidden
        />
        <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#25D366]/15 border border-[#25D366]/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#166534] dark:text-[#86efac] mb-3">
              For sellers
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Open <span className="text-[#38A169]">requests</span>
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Buyers post what they want. Send a competitive offer and we deliver it to them on WhatsApp.
            </p>
          </div>
          <Link
            href="/request-car"
            className="inline-flex items-center justify-center shrink-0 bg-[#38A169] hover:bg-[#2F855A] text-white px-5 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/15"
            style={{ borderRadius: "var(--radius)" }}
          >
            Post a request
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-10 sm:pb-12 pt-4 sm:pt-5">
        <div className="max-w-5xl mx-auto">
          <BuyerRequestBoard />
        </div>
      </section>
    </div>
  );
}
