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
    title: "Open Car Requests | BIDGARI",
  },
};

export default function BuyerRequestsBoardPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <section className="border-b border-slate-200 pt-14 sm:pt-16 pb-5 sm:pb-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Open car requests
            </h1>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-2xl">
              Buyers post what they want. Send a competitive offer and we deliver it to them on WhatsApp.
            </p>
          </div>
          <Link
            href="/request-car"
            className="btn btn-primary shrink-0"
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
