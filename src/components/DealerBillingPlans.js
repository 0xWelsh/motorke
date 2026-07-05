import {
  DEALER_BILLING_ACTIVE,
  DEALER_BILLING_FAQ,
  DEALER_BOOST_ADDONS,
  DEALER_HOMEPAGE_FEATURED_PRICE,
  DEALER_INCLUDED_EVERY_PLAN,
  DEALER_LISTING_PLANS,
  DEALER_PRICING_EARLY_ACCESS,
  formatBoostsIncluded,
  formatKes,
  getCostPerLiveSlot,
  getDealerListingPlan,
  getPrepaid3MonthSavings,
  getPrepaid6MonthSavings,
  suggestPlanForLiveCount,
} from "@/lib/dealer-pricing";
import { getSupportEmail } from "@/lib/site-contact";
import Link from "next/link";
import { CheckCircle2, Lock, Zap } from "lucide-react";

/**
 * @param {{ liveCarCount?: number, suggestedPlanId?: string, boostBalance?: { spotlight7d: number, hotBadge7d: number } | null }} props
 */
export default function DealerBillingPlans({
  liveCarCount = 0,
  suggestedPlanId,
  boostBalance = null,
}) {
  const support = getSupportEmail();
  const suggested =
    suggestedPlanId || suggestPlanForLiveCount(liveCarCount);
  const suggestedPlan = getDealerListingPlan(suggested);

  return (
    <div className="space-y-10">
      {/* Account status */}
      <section
        aria-labelledby="billing-status-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#111111]"
      >
        <h2
          id="billing-status-heading"
          className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500"
        >
          Your account
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Status</p>
            <p className="mt-1 text-lg font-bold text-[#2F855A]">
              {DEALER_PRICING_EARLY_ACCESS ? "Early access" : "Active"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">
              {DEALER_PRICING_EARLY_ACCESS
                ? "Full portal access, no invoice"
                : "Billing enabled"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Live listings now</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{liveCarCount}</p>
            {suggestedPlan && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">
                Likely fit when billing starts:{" "}
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {suggestedPlan.name}
                </span>
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Boost credits</p>
            {boostBalance ? (
              <>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {boostBalance.spotlight7d} Spotlight · {boostBalance.hotBadge7d} Hot
                </p>
                <Link
                  href="/portal/boosts"
                  className="mt-1 inline-flex text-xs font-semibold text-[#2F855A] hover:underline"
                >
                  Apply boosts
                </Link>
              </>
            ) : (
              <>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">—</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">
                  {DEALER_BILLING_ACTIVE
                    ? "Shown here when your plan is active"
                    : "Use boosts in the portal (no charge yet)"}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {!DEALER_BILLING_ACTIVE && (
        <div
          className="flex gap-3 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          <Lock className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-semibold">Billing is not active yet</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
              All prices below are published for transparency. You cannot subscribe or buy boosts in the app until we
              announce go-live by email. No M-Pesa prompts will be sent from this page today.
            </p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <section aria-labelledby="plan-cards-heading">
        <h2 id="plan-cards-heading" className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Choose a listing plan
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4">
          Based on how many cars you keep <strong className="font-semibold">live</strong> on BIDGARI at once.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {DEALER_LISTING_PLANS.map((plan) => {
            const isSuggested = plan.id === suggested;
            const isPopular = plan.id === "standard";
            return (
              <div
                key={plan.id}
                className={[
                  "relative flex flex-col rounded-xl border p-4 sm:p-5",
                  isSuggested
                    ? "border-[#2F855A] ring-1 ring-[#2F855A]/30"
                    : "border-slate-200 dark:border-slate-800",
                  "bg-white dark:bg-[#111111]",
                ].join(" ")}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 left-4 bg-[#111827] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white dark:bg-[#2F855A]">
                    Popular
                  </span>
                )}
                {isSuggested && !isPopular && (
                  <span className="absolute -top-2.5 left-4 bg-[#2F855A] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    Fits your stock
                  </span>
                )}
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{plan.tagline}</p>
                <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatKes(plan.pricing.monthly)}
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500"> / mo</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                  Up to {plan.liveListingCap} live · ~{formatKes(getCostPerLiveSlot(plan))}/slot
                </p>
                <div className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-[#2F855A]">
                  <Zap className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
                  <span>{formatBoostsIncluded(plan)}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                  <li>6 mo: {formatKes(plan.pricing.months6)} (save {formatKes(getPrepaid6MonthSavings(plan))})</li>
                  <li>3 mo: {formatKes(plan.pricing.months3)} (save {formatKes(getPrepaid3MonthSavings(plan))})</li>
                </ul>
                <button
                  type="button"
                  disabled
                  title="Billing is not active yet"
                  className="mt-4 w-full cursor-not-allowed border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:border-slate-700 dark:bg-zinc-900 dark:text-zinc-500"
                >
                  {DEALER_BILLING_ACTIVE ? "Subscribe" : "Not available yet"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Full comparison table */}
      <section aria-labelledby="listing-plans-heading">
        <h2
          id="listing-plans-heading"
          className="text-lg font-bold text-slate-900 dark:text-white mb-1"
        >
          Full comparison
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4">
          Mark sold cars in the portal to free slots. Included boosts reset each billing month.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-zinc-900/80">
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Plan
                </th>
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Live cap
                </th>
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  / month
                </th>
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  3 months
                </th>
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  6 months
                </th>
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#2F855A]">
                  Free boosts / month
                </th>
              </tr>
            </thead>
            <tbody>
              {DEALER_LISTING_PLANS.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-bold text-slate-900 dark:text-white">{plan.name}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{plan.tagline}</div>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                    {plan.liveListingCap}
                  </td>
                  <td className="px-4 py-3 align-top font-semibold whitespace-nowrap">{formatKes(plan.pricing.monthly)}</td>
                  <td className="px-4 py-3 align-top text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                    {formatKes(plan.pricing.months3)}
                  </td>
                  <td className="px-4 py-3 align-top text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                    {formatKes(plan.pricing.months6)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-start gap-1.5 text-slate-800 dark:text-zinc-200">
                      <Zap className="h-3.5 w-3.5 shrink-0 text-[#2F855A] mt-0.5" aria-hidden />
                      <span className="text-xs font-semibold leading-snug">{formatBoostsIncluded(plan)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 pl-5">
                      Up to {plan.maxConcurrentSpotlight} Spotlight at once
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add-on boosts */}
      <section aria-labelledby="addon-boosts-heading">
        <h2
          id="addon-boosts-heading"
          className="text-lg font-bold text-slate-900 dark:text-white mb-1"
        >
          Extra boosts (add-ons)
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4">
          Use your plan&apos;s free credits first. Purchase add-ons when billing is active.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-zinc-900/80">
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Boost
                </th>
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Duration
                </th>
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Price
                </th>
                <th scope="col" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Buy
                </th>
              </tr>
            </thead>
            <tbody>
              {DEALER_BOOST_ADDONS.map((boost) => (
                <tr
                  key={boost.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{boost.name}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{boost.description}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                    {boost.durationLabel}
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatKes(boost.price)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                      Soon
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50/50 dark:bg-zinc-900/40">
                <td className="px-4 py-3" colSpan={2}>
                  <div className="font-semibold text-slate-900 dark:text-white">Homepage featured dealer</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                    Limited slots · subject to approval
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">
                  {formatKes(DEALER_HOMEPAGE_FEATURED_PRICE)} / mo
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Contact us
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Included on every plan</h2>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-zinc-300">
          {[...DEALER_INCLUDED_EVERY_PLAN, `Email support: ${support}`].map((line) => (
            <li key={line} className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2F855A] mt-0.5" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="billing-faq-heading">
        <h2 id="billing-faq-heading" className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Billing FAQ
        </h2>
        <dl className="space-y-4">
          {DEALER_BILLING_FAQ.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"
            >
              <dt className="text-sm font-bold text-slate-900 dark:text-white">{item.q}</dt>
              <dd className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="text-sm text-slate-600 dark:text-zinc-400 pb-4">
        More than 500 live listings or group billing:{" "}
        <a href={`mailto:${support}`} className="font-semibold text-[#2F855A] hover:underline">
          {support}
        </a>
      </p>
    </div>
  );
}
