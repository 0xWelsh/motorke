import { notFound } from "next/navigation";
import Link from "next/link";
import DutyPageClient from "@/components/DutyPageClient";
import {
  getDutyVehicleBySlug,
  getPopularDutyVehicles,
  serializeDutyVehicleForClient,
} from "@/lib/duty-calculator-service";
import { dutyVehicleLabel, dutyVehiclePathSlug } from "@/lib/duty-vehicle-slug";
import { getDutyRates } from "@/lib/duty-rates";
import { getSiteOrigin } from "@/lib/site-url";
import DutyJsonLd from "@/components/DutyJsonLd";

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const vehicle = await getDutyVehicleBySlug(slug);
    if (!vehicle) return { title: "Import duty estimate" };

    const label = dutyVehicleLabel(vehicle);
    return {
      title: `${label} import duty estimate Kenya`,
      description: `Indicative KRA import duty, excise, VAT, and levies for a ${label}. Search verified ${vehicle.make} ${vehicle.model} cars on BIDGARI.`,
      alternates: { canonical: `/duty/${dutyVehiclePathSlug(vehicle)}` },
      openGraph: {
        title: `${label} import duty estimate`,
        description: `Estimated import taxes for ${label} in Kenya.`,
        url: `${getSiteOrigin()}/duty/${dutyVehiclePathSlug(vehicle)}`,
      },
    };
  } catch {
    return { title: "Import duty estimate" };
  }
}

export default async function DutyVehiclePage({ params }) {
  const { slug } = await params;
  const vehicle = await getDutyVehicleBySlug(slug);
  if (!vehicle) notFound();

  const [popularRows, ratesPayload] = await Promise.all([
    getPopularDutyVehicles({ take: 8 }),
    getDutyRates().catch(() => null),
  ]);

  const initialVehicle = serializeDutyVehicleForClient(vehicle);
  const popularVehicles = popularRows.map(serializeDutyVehicleForClient).filter(Boolean);
  const ratesLastUpdated =
    ratesPayload?.meta?.lastUpdated || ratesPayload?.rates?.metadata?.fetchedAt || null;

  const pathSlug = dutyVehiclePathSlug(vehicle);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DutyJsonLd vehicle={vehicle} pathname={`/duty/${pathSlug}`} />
      <div className="home-shell pt-[4.75rem] md:pt-24 pb-8">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-slate-500 mb-4 duty-print-hide" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-slate-900 font-medium">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/duty" className="hover:text-slate-900">
              Duty calculator
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-500">{dutyVehicleLabel(vehicle)}</span>
          </nav>
        </div>
      </div>

      <DutyPageClient
        showHero={false}
        initialVehicle={initialVehicle}
        pageSlug={dutyVehiclePathSlug(vehicle)}
        popularVehicles={popularVehicles}
        ratesLastUpdated={ratesLastUpdated}
      />
    </div>
  );
}
