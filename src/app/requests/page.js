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
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <section className="border-b border-slate-100 dark:border-zinc-900 pt-20 sm:pt-28 pb-8 sm:pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">For sellers</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
              Open car requests
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
              Buyers post what they want. You send a competitive offer — we deliver it to them on WhatsApp.
            </p>
          </div>
          <Link
            href="/request-car"
            className="inline-flex items-center justify-center shrink-0 bg-[#38A169] hover:bg-[#2F855A] text-white px-5 py-3 text-xs font-black uppercase tracking-widest"
            style={{ borderRadius: "var(--radius)" }}
          >
            Post a request
          </Link>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <BuyerRequestBoard />
        </div>
      </section>
    </div>
  );
}
