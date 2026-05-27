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
    <div className="min-h-screen bg-[#e8f1fa] dark:bg-[#0c1524]">
      <section className="border-b border-sky-200/80 dark:border-sky-900/60 pt-14 sm:pt-16 pb-5 sm:pb-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Request a car
          </h1>
          <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Give us the details of the car you want. Verified sellers see your request without your phone
            number and send offers through Welsh Motorhub, usually within a few hours.
          </p>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            Requests stay live for <strong className="text-slate-800 dark:text-slate-200">7 days</strong>.
            Are you a seller?{" "}
            <Link href="/requests" className="font-bold text-[#2563eb] dark:text-sky-300 hover:underline">
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
