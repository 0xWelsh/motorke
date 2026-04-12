// src/app/dealers/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowUpRight, Building2, CarFront, MapPin, ShieldCheck } from "lucide-react";

export const metadata = { title: "Dealers — Motorke Kenya" };

export default async function DealersPage() {
  const dealers = await db.dealer.findMany({
    include: {
      _count: { select: { cars: { where: { available: true } } } },
      users: { select: { avatarUrl: true }, take: 1 },
    },
    orderBy: [{ featured: "desc" }, { verified: "desc" }, { name: "asc" }],
  });

  const counties = [...new Set(dealers.map((d) => d.county))].sort();
  const featuredCount = dealers.filter((d) => d.featured).length;
  const verifiedCount = dealers.filter((d) => d.verified).length;
  const totalCars = dealers.reduce((sum, dealer) => sum + (dealer._count?.cars || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 max-w-7xl">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">Trusted Dealers</h1>
          <p className="text-base text-slate-600 font-medium max-w-3xl mb-10">
            Browse verified dealer profiles by county and find your next car.
          </p>

          {/* Stats Grid */}
          <div className="border-t border-b border-slate-200 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Dealerships", value: dealers.length },
              { label: "Verified", value: verifiedCount },
              { label: "Featured", value: featuredCount },
              { label: "Live Cars", value: totalCars },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{item.label}</p>
                <p className="text-3xl font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </header>

        {/* County Navigation */}
        <nav className="flex items-center gap-2 mb-12 overflow-x-auto pb-2">
          {counties.map((county) => (
            <a
              key={county}
              href={`#county-${encodeURIComponent(county)}`}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              {county}
            </a>
          ))}
        </nav>

        {/* Empty State */}
        {dealers.length === 0 && (
          <div className="border-y border-slate-200 py-16">
            <p className="text-sm text-slate-600">No dealers available yet.</p>
          </div>
        )}

        {/* Dealers by County */}
        {counties.map((county) => {
          const countyDealers = dealers.filter((d) => d.county === county);

          return (
            <section key={county} id={`county-${encodeURIComponent(county)}`} className="mb-16 last:mb-0 scroll-mt-40">
              <h2 className="text-lg font-bold text-slate-900 mb-6">{county}</h2>

              <div className="space-y-4 border-b border-slate-200 pb-8">
                {countyDealers.map((dealer) => {
                  const brandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl;

                  return (
                  <Link
                    key={dealer.id}
                    href={`/dealers/${dealer.slug}`}
                    className="group block p-5 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-5">
                      {/* Logo */}
                      <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {brandImage ? (
                          <img src={brandImage} alt={dealer.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-900 font-bold text-lg">{dealer.name?.[0] || '?'}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors truncate">{dealer.name}</h3>
                          {dealer.verified && (
                            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              Verified
                            </span>
                          )}
                          {dealer.featured && (
                            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">Featured</span>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-2">
                          <MapPin size={14} className="text-slate-400" /> {dealer.location || 'Location not set'}
                        </p>

                        {dealer.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {dealer.description}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-slate-900">{dealer._count.cars}</p>
                        <p className="text-xs text-slate-500 font-medium">Live Cars</p>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
