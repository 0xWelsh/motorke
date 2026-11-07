// Served from the Vercel edge; re-rendered at most every 3600s.
// No searchParams or cookies on this route, so the output is cacheable.
export const revalidate = 3600;

import Link from "next/link";
import BuyerRequestForm from "@/components/buyer-requests/BuyerRequestForm";
import { absoluteUrl } from "@/lib/site-url";

export const metadata = {
  title: "Request a Car",
  description:
    "Tell BIDGARI what you want to buy. Verified sellers send offers on WhatsApp.",
  alternates: { canonical: "/request-car" },
  openGraph: {
    url: absoluteUrl("/request-car"),
    title: "Request a Car | BIDGARI",
    description: "Post your ideal car spec and receive seller offers fast.",
  },
};

export default function RequestCarPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <section className="border-b border-slate-200 pt-14 sm:pt-16 pb-5 sm:pb-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Request a car
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
            Give us the details of the car you want. Verified sellers see your request without your phone
            number and send offers through BIDGARI, usually within a few hours.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Requests stay live for <strong className="text-slate-700">7 days</strong>.
            Are you a seller?{" "}
            <Link href="/requests" className="font-bold text-accent hover:underline">
              Browse open requests
            </Link>
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-10 sm:pb-12 pt-4 sm:pt-5">
        <div className="max-w-3xl mx-auto">
          <BuyerRequestForm />
        </div>
      </section>
    </div>
  );
}
