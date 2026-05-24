import DealerBillingPlans from "@/components/DealerBillingPlans";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  DEALER_BILLING_ACTIVE,
  DEALER_PRICING_EARLY_ACCESS,
} from "@/lib/dealer-pricing";
import { getOrCreateBoostBalance } from "@/lib/dealer-boosts";
import { getSupportEmail } from "@/lib/site-contact";
import { Gift, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Plans & billing",
};

export default async function SubscriptionPage() {
  const session = await getSession();
  if (!session?.user?.dealerId) {
    redirect("/login?callbackUrl=/portal/subscription");
  }

  const dealerId = session.user.dealerId;

  const [liveCarCount, subscription, boostBalanceRow] = await Promise.all([
    db.car.count({
      where: { dealerId, available: true },
    }),
    db.subscription.findUnique({
      where: { dealerId },
      select: { plan: true, status: true, endDate: true },
    }),
    getOrCreateBoostBalance(dealerId),
  ]);

  const support = getSupportEmail();

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Plans &amp; billing
          </h1>
          {!DEALER_BILLING_ACTIVE && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Preview only
            </span>
          )}
        </div>
        <p className="text-slate-700 dark:text-zinc-300 font-medium leading-relaxed max-w-2xl">
          {DEALER_PRICING_EARLY_ACCESS ? (
            <>
              Full pricing for listing plans and boosts is published below.{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                You are not being charged
              </span>{" "}
              — checkout stays off until we email dealers before go-live.
            </>
          ) : (
            <>Manage your plan, included boost credits, and add-on purchases.</>
          )}
        </p>
      </div>

      {DEALER_PRICING_EARLY_ACCESS && (
        <div className="mb-10 rounded-2xl border border-[#ddd4c8] dark:border-slate-800 bg-white dark:bg-[#111111] p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2F855A]/10 text-[#2F855A] dark:bg-emerald-950/50 dark:text-emerald-400">
              <Gift size={24} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                Early access — no billing yet
                <Sparkles size={16} className="text-[#2F855A] shrink-0" aria-hidden />
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                You have full portal access today: list stock, receive leads, mark sold. When paid plans launch,
                your tier will set live listing limits and monthly Spotlight credits. Questions:{" "}
                <a href={`mailto:${support}`} className="font-semibold text-[#2F855A] hover:underline">
                  {support}
                </a>
                .
              </p>
              {subscription?.plan && subscription.plan !== "FREE" && (
                <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
                  Legacy record on file ({subscription.plan}, {subscription.status}) — not billed through this
                  preview.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <DealerBillingPlans
        liveCarCount={liveCarCount}
        boostBalance={{
          spotlight7d: boostBalanceRow.spotlight7d,
          hotBadge7d: boostBalanceRow.hotBadge7d,
        }}
      />
    </div>
  );
}
