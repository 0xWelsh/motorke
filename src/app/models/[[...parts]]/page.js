export const revalidate = 3600;

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ChevronLeft, ArrowUpRight, Cog, Fuel, Gauge, Shirt, Ruler, Weight } from "lucide-react";
import { db } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, DRIVETRAIN_LABELS } from "@/lib/constants";

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function resolveMake(slug) {
  const rows = await withDbRetry(() =>
    db.carModelSpec.findMany({
      where: { published: true },
      distinct: ["make"],
      select: { make: true },
    })
  );
  return rows.find((r) => slugify(r.make) === slug)?.make || null;
}

async function resolveModel(make, slug) {
  const rows = await withDbRetry(() =>
    db.carModelSpec.findMany({
      where: { published: true, make: { equals: make, mode: "insensitive" } },
      distinct: ["model"],
      select: { model: true },
    })
  );
  return rows.find((r) => slugify(r.model) === slug)?.model || null;
}

async function getAllMakes() {
  const rows = await withDbRetry(() =>
    db.carModelSpec.findMany({
      where: { published: true },
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    })
  );
  return rows.map((r) => r.make).filter(Boolean);
}

async function getModelsForMake(make) {
  const rows = await withDbRetry(() =>
    db.carModelSpec.findMany({
      where: { published: true, make: { equals: make, mode: "insensitive" } },
      select: { model: true, imageUrl: true, yearStart: true, yearEnd: true },
      orderBy: { model: "asc" },
    })
  );
  const seen = new Set();
  return rows.filter((r) => {
    if (!r.model || seen.has(r.model)) return false;
    seen.add(r.model);
    return true;
  });
}

async function getModelGenerations(make, model) {
  return await withDbRetry(() =>
    db.carModelSpec.findMany({
      where: {
        published: true,
        make: { equals: make, mode: "insensitive" },
        model: { equals: model, mode: "insensitive" },
      },
      orderBy: { yearStart: "desc" },
    })
  );
}

async function getSingleSpec(make, model, year) {
  const specs = await withDbRetry(() =>
    db.carModelSpec.findMany({
      where: {
        published: true,
        make: { equals: make, mode: "insensitive" },
        model: { equals: model, mode: "insensitive" },
        yearStart: { lte: parseInt(year) },
        OR: [
          { yearEnd: { gte: parseInt(year) } },
          { yearEnd: null },
        ],
      },
    })
  );
  return specs[0] || null;
}

async function makesPage() {
  const makes = await getAllMakes();
  if (!makes.length) notFound();

  const counts = {};
  for (const make of makes) {
    const c = await withDbRetry(() =>
      db.carModelSpec.count({ where: { published: true, make } })
    );
    counts[make] = c;
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
            Welsh Motorhub Encyclopedia
          </p>
          <h1 className="mt-2 font-serif text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Car Models Encyclopedia
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Browse detailed specs, photos, and history of every car make and model.
            Research before you buy — compare engines, dimensions, fuel economy, and more.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {makes.map((make) => (
            <Link
              key={make}
              href={`/models/${slugify(make)}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-lg font-black text-emerald-700 group-hover:bg-emerald-100">
                {make[0]}
              </div>
              <p className="font-serif text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                {make}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {counts[make] || 0} {counts[make] === 1 ? "model" : "models"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

async function makePage(make) {
  const models = await getModelsForMake(make);
  if (!models.length) notFound();

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          <Link href="/models" className="hover:text-emerald-600">Models</Link>
          <ChevronRight className="size-3" />
          <span className="text-slate-900">{make}</span>
        </nav>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {make} Models
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Browse all {make} car models in our encyclopedia.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <Link
              key={m.model}
              href={`/models/${slugify(make)}/${slugify(m.model)}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-emerald-300 hover:shadow-md"
            >
              {m.imageUrl ? (
                <div className="aspect-video overflow-hidden bg-slate-100">
                  <img
                    src={m.imageUrl}
                    alt={`${make} ${m.model}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
                  <span className="text-5xl font-black text-emerald-300/60">{make[0]}</span>
                </div>
              )}
              <div className="p-4">
                <h2 className="font-serif text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                  {make} {m.model}
                </h2>
                <p className="text-xs font-semibold text-slate-400">
                  {m.yearStart}{m.yearEnd ? ` – ${m.yearEnd}` : "+"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

async function modelPage(make, model) {
  const gens = await getModelGenerations(make, model);
  if (!gens.length) notFound();

  const latest = gens[0];

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          <Link href="/models" className="hover:text-emerald-600">Models</Link>
          <ChevronRight className="size-3" />
          <Link href={`/models/${slugify(make)}`} className="hover:text-emerald-600">{make}</Link>
          <ChevronRight className="size-3" />
          <span className="text-slate-900">{model}</span>
        </nav>

        {latest.imageUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img
              src={latest.imageUrl}
              alt={`${make} ${model}`}
              className="w-full max-h-[400px] object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {make} {model}
          </h1>
          {latest.engineCC && latest.horsepower && (
            <p className="mt-1 font-serif text-lg text-slate-500">
              {latest.engineCC >= 1000 ? `${(latest.engineCC / 1000).toFixed(1)}L` : `${latest.engineCC}cc`}
              {latest.horsepower ? ` · ${latest.horsepower} hp` : ""}
              {latest.fuelType ? ` · ${FUEL_LABELS[latest.fuelType] || latest.fuelType}` : ""}
            </p>
          )}
        </header>

        <div className="mb-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Generations & Trims
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gens.map((gen) => (
              <Link
                key={gen.id}
                href={`/models/${slugify(make)}/${slugify(model)}/${gen.yearStart}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-sm"
              >
                <p className="font-serif text-base font-bold text-slate-900">
                  {gen.yearStart}{gen.yearEnd ? ` – ${gen.yearEnd}` : "+"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {gen.bodyType && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {BODY_TYPE_LABELS[gen.bodyType] || gen.bodyType}
                    </span>
                  )}
                  {gen.fuelType && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {FUEL_LABELS[gen.fuelType] || gen.fuelType}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  {gen.engineCC && <span>{Math.round(gen.engineCC / 10) / 100}L</span>}
                  {gen.horsepower && <span>{gen.horsepower}hp</span>}
                  {gen.transmission && <span>{TRANSMISSION_LABELS[gen.transmission] || gen.transmission}</span>}
                </div>
                {gen.standardFeatures?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {gen.standardFeatures.slice(0, 3).map((f) => (
                      <span key={f} className="text-[10px] text-emerald-600">
                        {f}
                      </span>
                    ))}
                    {gen.standardFeatures.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{gen.standardFeatures.length - 3}</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function yearPage(make, model, year) {
  const spec = await getSingleSpec(make, model, year);
  if (!spec) notFound();

  const specRows = [];

  if (spec.engineCC || spec.cylinders || spec.horsepower || spec.torque || spec.turbo) {
    specRows.push({ label: "Engine", icon: Cog, value: [
      spec.engineCC ? `${Math.round(spec.engineCC / 10) / 100}L` : null,
      spec.cylinders ? `${spec.cylinders}-cyl` : null,
      spec.turbo ? "Turbo" : null,
      spec.horsepower ? `${spec.horsepower} hp` : null,
      spec.torque ? `${spec.torque} Nm` : null,
    ].filter(Boolean).join(" · ") });
  }

  if (spec.fuelType) {
    specRows.push({ label: "Fuel", icon: Fuel, value: FUEL_LABELS[spec.fuelType] || spec.fuelType });
  }
  if (spec.transmission) {
    specRows.push({ label: "Transmission", icon: Cog, value: TRANSMISSION_LABELS[spec.transmission] || spec.transmission });
  }
  if (spec.drivetrain) {
    specRows.push({ label: "Drivetrain", icon: Gauge, value: DRIVETRAIN_LABELS[spec.drivetrain] || spec.drivetrain });
  }
  if (spec.bodyType) {
    specRows.push({ label: "Body", icon: Shirt, value: BODY_TYPE_LABELS[spec.bodyType] || spec.bodyType });
  }

  if (spec.seats || spec.doors || spec.curbWeightKg || spec.fuelTankLiters) {
    specRows.push({ label: "Dimensions", icon: Ruler, value: [
      spec.seats ? `${spec.seats} seats` : null,
      spec.doors ? `${spec.doors} doors` : null,
      spec.curbWeightKg ? `${spec.curbWeightKg} kg` : null,
      spec.fuelTankLiters ? `${spec.fuelTankLiters}L tank` : null,
    ].filter(Boolean).join(" · ") });
  }

  if (spec.standardFeatures?.length > 0) {
    specRows.push({ label: "Features", icon: Cog, value: spec.standardFeatures.slice(0, 8).join(", ") });
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          <Link href="/models" className="hover:text-emerald-600">Models</Link>
          <ChevronRight className="size-3" />
          <Link href={`/models/${slugify(make)}`} className="hover:text-emerald-600">{make}</Link>
          <ChevronRight className="size-3" />
          <Link href={`/models/${slugify(make)}/${slugify(model)}`} className="hover:text-emerald-600">{model}</Link>
          <ChevronRight className="size-3" />
          <span className="text-slate-900">{year}</span>
        </nav>

        <Link
          href={`/models/${slugify(make)}/${slugify(model)}`}
          className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
        >
          <ChevronLeft className="size-3" /> Back to {model} generations
        </Link>

        {spec.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl">
            <img
              src={spec.imageUrl}
              alt={`${make} ${model} ${year}`}
              className="w-full max-h-[350px] object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {make} {model} {year}
          </h1>
          {spec.variant && (
            <p className="font-serif text-lg text-emerald-700">{spec.variant}</p>
          )}
          <p className="mt-1 text-sm text-slate-400">
            {spec.yearStart}{spec.yearEnd ? ` – ${spec.yearEnd}` : "+"}
            {spec.verified && <span className="ml-2 text-emerald-600">· Verified</span>}
          </p>
        </header>

        <div className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {specRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 px-5 py-3.5">
                <row.icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{row.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Buy a {make} {model}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Browse current listings for {make} {model} in Kenya.
          </p>
          <Link
            href={`/cars?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-emerald-700"
          >
            View listings <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function ModelsPage({ params }) {
  const { parts } = await params;
  const p = parts || [];

  if (p.length === 0) return makesPage();

  const make = await resolveMake(p[0]);
  if (!make) notFound();

  if (p.length === 1) return makePage(make);

  const model = await resolveModel(make, p[1]);
  if (!model) notFound();

  if (p.length === 2) return modelPage(make, model);
  if (p.length >= 3) return yearPage(make, model, p[2]);

  notFound();
}
