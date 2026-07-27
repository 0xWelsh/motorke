import {
  getPopularDutyVehicles,
  serializeDutyVehicleForClient,
} from "@/lib/duty-calculator-service";
import { getDutyRates } from "@/lib/duty-rates";
import DutyPageClient from "@/components/DutyPageClient";
import DutyJsonLd from "@/components/DutyJsonLd";

export const dynamic = "force-dynamic";

export default async function DutyCalculatorPage() {
  const [popularRows, ratesPayload] = await Promise.all([
    getPopularDutyVehicles({ take: 8 }),
    getDutyRates().catch(() => null),
  ]);

  const popularVehicles = popularRows.map(serializeDutyVehicleForClient).filter(Boolean);
  const ratesLastUpdated =
    ratesPayload?.meta?.lastUpdated || ratesPayload?.rates?.metadata?.fetchedAt || null;

  return (
    <div className="min-h-screen bg-[#1c1c1c]">
      <DutyJsonLd pathname="/duty" />
      <DutyPageClient popularVehicles={popularVehicles} ratesLastUpdated={ratesLastUpdated} />
    </div>
  );
}
