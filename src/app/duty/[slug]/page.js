import { notFound } from "next/navigation";
import Link from "next/link";
import DutyPageClient from "@/components/DutyPageClient";
import { getDutyVehicleBySlug } from "@/lib/duty-calculator-service";
import { dutyVehicleLabel } from "@/lib/duty-vehicle-slug";
import { getSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const vehicle = await getDutyVehicleBySlug(slug);
  if (!vehicle) return { title: "Import duty estimate" };

  const label = dutyVehicleLabel(vehicle);
  return {
    title: `${label} import duty estimate Kenya`,
    description: `Indicative KRA import duty, excise, VAT, and levies for a ${label}. Search verified ${vehicle.make} ${vehicle.model} cars on Welsh Motorhub.`,
    alternates: { canonical: `/duty/${vehicle.slug}` },
    openGraph: {
      title: `${label} import duty estimate`,
      description: `Estimated import taxes for ${label} in Kenya.`,
      url: `${getSiteOrigin()}/duty/${vehicle.slug}`,
    },
  };
}

export default async function DutyVehiclePage({ params }) {
  const { slug } = await params;
  const vehicle = await getDutyVehicleBySlug(slug);
  if (!vehicle) notFound();

  const initialVehicle = {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    year: vehicle.year,
    engineCC: vehicle.engineCC,
    fuelType: vehicle.fuelType,
    crspKes: vehicle.crspKes,
    slug: vehicle.slug,
    label: dutyVehicleLabel(vehicle),
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="home-shell pt-[4.75rem] md:pt-24 pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-slate-500 mb-6">
            <Link href="/duty" className="hover:text-slate-900 dark:hover:text-white">
              Duty calculator
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800 dark:text-slate-200">{dutyVehicleLabel(vehicle)}</span>
          </nav>

          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 editorial-heading">
            {dutyVehicleLabel(vehicle)} import duty
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
            Indicative breakdown using CRSP reference {vehicle.crspKes.toLocaleString("en-KE")} KES ·{" "}
            {vehicle.engineCC}cc · {vehicle.year} model year.
          </p>

          <DutyPageClient initialVehicle={initialVehicle} pageSlug={vehicle.slug} />
        </div>
      </div>
    </div>
  );
}
