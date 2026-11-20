// Served from the Vercel edge; re-rendered at most every 3600s.
// No searchParams or cookies on this route, so the output is cacheable.
export const revalidate = 3600;

import Link from "next/link";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";
import { absoluteUrl } from "@/lib/site-url";
import NikkyoStockCard from "@/components/NikkyoStockCard";
import { Search, Car, Ship, FileCheck, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Used Cars for Sale in Kenya | Imported & Duty Paid | BIDGARI",
  description:
    "Browse verified Japanese and European used cars for sale in Kenya. Transparent prices, duty-paid listings, handled end-to-end by BIDGARI across Nairobi and Mombasa.",
  alternates: { canonical: "/kenya" },
  openGraph: {
    url: absoluteUrl("/kenya"),
    title: "Used Cars for Sale in Kenya | BIDGARI",
    description:
      "Verified duty-paid imports from Japan and Europe. BIDGARI-handled sales, transparent pricing, direct WhatsApp contact.",
    type: "website",
  },
};

const getKenyaCars = unstable_cache(
  async () => {
    return db.car.findMany({
      where: {
        ...publicDetailVisibilityClause(),
        ...(PUBLIC_ONLY_VERIFIED_DEALERS ? { dealer: { verificationStatus: "VERIFIED" } } : {}),
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        dealer: { select: { id: true, name: true, slug: true, location: true, county: true } },
      },
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: 8,
    });
  },
  ["kenya-landing-cars-v1"],
  { revalidate: 600, tags: ["cars", "homepage"] },
);

const STEPS = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "Choose your car",
    desc: "Filter verified stock by brand, price, or body type — every listing shows year, mileage, engine, and a duty-paid price.",
  },
  {
    icon: <Car className="h-5 w-5" />,
    title: "Compare & enquire",
    desc: "Compare two cars side by side and message the BIDGARI team on WhatsApp. No middlemen, no commissions.",
  },
  {
    icon: <Ship className="h-5 w-5" />,
    title: "Shipping & duty",
    desc: "Use the duty calculator to see import costs and total landed price. Many listings already include duty.",
  },
  {
    icon: <FileCheck className="h-5 w-5" />,
    title: "Inspect & collect",
    desc: "Arrange a viewing in Nairobi or Mombasa, confirm documents, and drive away with your car.",
  },
];

export default async function KenyaPage() {
  const cars = await getKenyaCars();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-[var(--bg)] px-4 sm:px-6 pt-14 sm:pt-20 pb-10 sm:pb-14">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            Kenya
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Import used cars into Kenya the easy way
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Verified Japanese and European imports, priced transparently and handled by BIDGARI
            across Nairobi and Mombasa. Compare costs and buy with confidence.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/cars"
              className="btn btn-primary w-full sm:w-auto"
            >
              Browse stock <ArrowUpRight />
            </Link>
            <Link
              href="/duty"
              className="btn btn-neutral w-full sm:w-auto"
            >
              Calculate duty
            </Link>
          </div>
        </div>
      </section>

      {/* Popular stock */}
      {cars.length > 0 && (
        <section className="px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-6xl mx-auto">
            <div className="mb-5 flex items-baseline justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Popular cars in Kenya right now
              </h2>
              <Link
                href="/cars?sort=views_desc"
                className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:underline"
              >
                (All) <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8">
              {cars.map((car, i) => (
                <NikkyoStockCard key={car.id} car={car} priority={i < 4} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Import steps */}
      <section className="border-t border-slate-200 bg-white px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            From listing to your driveway
          </h2>
          <p className="text-center text-sm text-slate-500 mb-8 sm:mb-10">
            A transparent, BIDGARI-handled process for Kenyan buyers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-wash text-[var(--accent)]">
                    {s.icon}
                  </div>
                  <span className="text-[28px] font-black leading-none text-slate-100">0{i + 1}</span>
                </div>
                <h3 className="text-base font-black text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div>
            <h3 className="text-lg font-black text-slate-900">Can&apos;t find what you want?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Post a request and let the BIDGARI team source it for you.
            </p>
          </div>
          <Link
            href="/request-car"
            className="btn btn-primary shrink-0"
          >
            Request a car <ArrowUpRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
