import Link from "next/link";
import BuyerRequestForm from "@/components/buyer-requests/BuyerRequestForm";
import { absoluteUrl } from "@/lib/site-url";

export const metadata = {
  title: "Request a Car",
  description:
    "Tell Welsh Motorhub what you want to buy. Verified dealers and sellers send offers on WhatsApp.",
  alternates: { canonical: "/request-car" },
  openGraph: {
    url: absoluteUrl("/request-car"),
    title: "Request a Car | Welsh Motorhub",
    description: "Post your ideal car spec and receive seller offers fast.",
  },
};

export default function RequestCarPage() {
  return (
    <div className="min-h-screen bg-[#f4f7f5] dark:bg-[#0a0a0a]">
      <section className="relative overflow-hidden border-b border-emerald-100/80 dark:border-emerald-950/40 pt-14 sm:pt-16 pb-5 sm:pb-6 px-4 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,161,105,0.14),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(56,161,105,0.2),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 -top-16 h-48 w-48 rounded-full bg-[#38A169]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-[#38A169]/15 border border-[#38A169]/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a5c36] dark:text-[#86efac] mb-3">
            Buyer requests
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
            Request a <span className="text-[#38A169]">car</span>
          </h1>
          <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Tell us what you want. Verified sellers see your request without your phone number and send
            offers through Welsh Motorhub, usually within a few hours.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
            <span className="rounded-md bg-white/90 dark:bg-zinc-900/80 border border-sky-200/80 dark:border-sky-900/50 text-sky-800 dark:text-sky-200 px-2.5 py-1">
              Live 7 days
            </span>
            <span className="rounded-md bg-white/90 dark:bg-zinc-900/80 border border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 px-2.5 py-1">
              WhatsApp offers
            </span>
            <span className="rounded-md bg-white/90 dark:bg-zinc-900/80 border border-emerald-200/80 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2.5 py-1">
              Private number
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            Selling instead?{" "}
            <Link href="/requests" className="font-bold text-[#38A169] hover:underline">
              Browse open requests
            </Link>
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-10 sm:pb-12 pt-4 sm:pt-5">
        <div className="max-w-3xl mx-auto">
          <div
            className="border border-emerald-200/70 dark:border-emerald-900/50 bg-white dark:bg-[#111111] p-4 sm:p-6 shadow-[0_12px_40px_-24px_rgba(56,161,105,0.45)]"
            style={{ borderRadius: "var(--radius)" }}
          >
            <BuyerRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
