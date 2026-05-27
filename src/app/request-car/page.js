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
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <section className="border-b border-slate-100 dark:border-zinc-900 pt-20 sm:pt-28 pb-8 sm:pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Buyer requests</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Request a car
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Give us the details of the car you want. Verified sellers see your request (without your phone
            number) and send offers through Welsh Motorhub — usually within a few hours.
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
            Requests stay live for <strong className="text-slate-700 dark:text-slate-300">7 days</strong>.
            Are you a seller?{" "}
            <Link href="/requests" className="text-[#38A169] font-bold hover:underline">
              Browse open requests
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <BuyerRequestForm />
        </div>
      </section>
    </div>
  );
}
