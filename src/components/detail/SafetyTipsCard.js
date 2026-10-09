// src/components/detail/SafetyTipsCard.js
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const TIPS = [
  "Never pay a deposit to a private number — pay only at handover through BIDGARI.",
  "We never ask for money on WhatsApp. If someone does, it isn't us.",
  "Inspect the car in person and confirm the logbook matches the stock number.",
  "Meet at the yard during business hours and take someone with you.",
];

/** Anti-scam panel — sits under the contact card in the listing rail. */
export default function SafetyTipsCard() {
  return (
    <section className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
      <h2 className="text-[13px] font-bold text-slate-900">Safety tips</h2>
      <ul className="mt-2.5 space-y-2">
        {TIPS.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-600">
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" strokeWidth={2.5} aria-hidden />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-4 border-t border-rose-100 pt-3">
        <Link href="/safety" className="text-[11px] font-bold text-rose-600 hover:underline">
          Safety guide
        </Link>
        <Link href="/report" className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline">
          Report a scam
        </Link>
      </div>
    </section>
  );
}
