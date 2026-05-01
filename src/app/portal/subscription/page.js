import { CheckCircle2, Gift, Sparkles } from "lucide-react";

const INCLUDED = [
  "List vehicles on the marketplace (generous limits)",
  "Public dealer profile & showroom page",
  "Leads: enquiries, WhatsApp routing, and inbox tools",
  "Portal inventory, bulk tools, and analytics as we ship them",
  "Email support via sec@welsh.co.ke",
];

export const metadata = {
  title: "Plans",
};

export default function SubscriptionPage() {
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Plans &amp; access</h1>
        <p className="text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
          Dealer access is <span className="font-semibold text-slate-900 dark:text-white">free for now</span> while we
          grow traffic together. There are no charges, no card or M-Pesa checkout, and no invoices on this page until
          we announce paid plans with plenty of lead time.
        </p>
      </div>

      <div className="rounded-2xl border border-[#ddd4c8] dark:border-slate-800 bg-white dark:bg-[#111111] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2F855A]/10 text-[#2F855A] dark:bg-emerald-950/50 dark:text-emerald-400">
            <Gift size={28} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Early access included
              <Sparkles size={18} className="text-[#2F855A] dark:text-emerald-400 shrink-0" aria-hidden />
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Everyone on the platform gets the same dealer experience today.
            </p>
          </div>
        </div>

        <ul className="space-y-3 mb-8">
          {INCLUDED.map((line) => (
            <li key={line} className="flex gap-3 text-sm text-slate-700 dark:text-zinc-300">
              <CheckCircle2 size={18} className="shrink-0 text-[#2F855A] dark:text-emerald-400 mt-0.5" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-800/50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
          When we turn on subscriptions, you&apos;ll see pricing here and in email before any charge. Nothing is
          billed through the app today.
        </div>
      </div>
    </div>
  );
}
