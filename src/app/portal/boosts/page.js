export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDealerBoostStatus } from "@/lib/dealer-boosts";
import {
  DEALER_BILLING_ACTIVE,
  DEALER_PRICING_EARLY_ACCESS,
} from "@/lib/dealer-pricing";
import DealerBoostHub from "@/components/DealerBoostHub";
import { Zap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Boosts | Dealer Portal",
};

export default async function PortalBoostsPage() {
  const user = await requireDealer();
  const status = await getDealerBoostStatus(user.dealerId);

  const liveCars = await db.car.findMany({
    where: { dealerId: user.dealerId, available: true },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      spotlightUntil: true,
      hotBadgeUntil: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <Link
          href="/portal/inventory"
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={14} /> Inventory
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2F855A] flex items-center gap-1.5">
              <Zap size={14} /> Visibility
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Boosts
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
              Put your best stock in front of buyers. Spotlight adds a red outline and ranks
              higher in browse; Hot badge adds an orange outline; Dealer lift raises your whole showroom.
            </p>
          </div>
          {DEALER_PRICING_EARLY_ACCESS ? (
            <span className="inline-flex px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-[0.12em] dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
              Early access — no charge
            </span>
          ) : null}
        </div>
      </div>

      <DealerBoostHub
        initialStatus={JSON.parse(JSON.stringify(status))}
        liveCars={JSON.parse(JSON.stringify(liveCars))}
        billingActive={DEALER_BILLING_ACTIVE}
      />

      <p className="text-[11px] text-slate-500">
        Need more each month?{" "}
        <Link href="/portal/subscription" className="text-[#2F855A] font-semibold hover:underline">
          View plans & add-on prices
        </Link>
        .
      </p>
    </div>
  );
}
