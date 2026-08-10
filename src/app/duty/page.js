import {
  getPopularDutyVehicles,
  serializeDutyVehicleForClient,
  computeDutyEstimate,
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

  const initialVehicle = popularVehicles[0] || null;
  let initialEstimate = null;
  if (initialVehicle) {
    try {
      initialEstimate = await computeDutyEstimate({
        dutyVehicleId: initialVehicle.id,
        make: initialVehicle.make,
        model: initialVehicle.model,
        trim: initialVehicle.trim,
        year: initialVehicle.year,
        engineCC: initialVehicle.engineCC,
        fuelType: initialVehicle.fuelType,
        crspKes: initialVehicle.crspKes,
        slug: initialVehicle.slug,
        label: initialVehicle.label,
      });
    } catch {
      initialEstimate = null;
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DutyJsonLd pathname="/duty" />
      <DutyPageClient
        popularVehicles={popularVehicles}
        ratesLastUpdated={ratesLastUpdated}
        initialVehicle={initialVehicle}
        initialEstimate={initialEstimate}
      />
    </div>
  );
}
