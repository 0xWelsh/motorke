import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  Handshake,
  MapPin,
} from "lucide-react";
import TrackedLink from "@/components/TrackedLink";

const PARTNER_BG = "/images/backgrounds/car-dealership.jpg";

function UnitCount({ count }) {
  const n = count ?? 0;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[var(--accent)]">
        <Car className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-bold tabular-nums text-slate-900">
          {n === 0 ? "0" : `${n}+`}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Units available
        </p>
      </div>
    </div>
  );
}

export default function PartnerDealershipsSection({ dealers }) {
  if (!dealers?.length) return null;

  const borderRadius = "var(--radius)";

  return (
    <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20 bg-[var(--bg)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(480px,44vw)] lg:block">
        <Image
          src={PARTNER_BG}
          alt=""
          fill
          className="object-cover opacity-[0.14]"
          sizes="(min-width: 1024px) 44vw, 0"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--bg)] via-[var(--bg)]/92 to-transparent" />
      </div>

      <div className="home-shell relative z-10">
        <div className="mx-auto mb-8 max-w-3xl text-center lg:mb-10">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)] shadow-sm">
            <Handshake className="h-3.5 w-3.5" aria-hidden />
            Trusted partners
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            <span className="text-slate-900">Partner </span>
            <span className="text-[var(--accent)]">Dealerships</span>
          </h2>
          <p className="text-base font-medium leading-relaxed text-slate-500 sm:text-lg">
            We work exclusively with certified dealerships that meet our standards for verification,
            pricing transparency, and how inventory is presented to buyers.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dealers.map((dealer) => {
            const count = dealer._count?.cars ?? 0;
            const isFeatured = dealer.featured;
            return (
              <TrackedLink
                key={dealer.id}
                href={`/dealers/${dealer.slug}`}
                eventName="homepage_partner_dealer_card_click"
                eventPayload={{ dealerId: dealer.id, slug: dealer.slug, featured: isFeatured }}
                className={[
                  "group relative flex h-full flex-col overflow-visible bg-white",
                  "border p-5 pt-7 transition-all hover:shadow-xl sm:p-6 sm:pt-8",
                  isFeatured
                    ? "z-[1] border-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/35"
                    : "border-slate-200",
                ].join(" ")}
                style={{ borderRadius }}
              >
                {isFeatured && (
                  <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--accent)] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-md">
                      <span className="text-amber-300" aria-hidden>
                        ★
                      </span>
                      Featured dealer
                    </span>
                  </div>
                )}

                <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
                  {dealer.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[var(--accent)]">
                      <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                      Partner
                    </span>
                  )}
                </div>

                <div className="mb-4 flex items-start gap-4 pr-16 sm:pr-20">
                  <div
                    className="relative h-16 w-16 shrink-0 overflow-hidden border border-slate-200 bg-slate-50"
                    style={{ borderRadius }}
                  >
                    {dealer.logoUrl ? (
                      <Image
                        src={dealer.logoUrl}
                        fill
                        className="object-contain p-2"
                        alt={`${dealer.name} logo`}
                        sizes="64px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-900">
                        {dealer.name?.[0] ?? "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="mb-1 break-words text-lg font-bold text-slate-900 transition-colors group-hover:text-[var(--accent)]">
                      {dealer.name}
                    </h3>
                    <p className="flex items-start gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                      <span className="leading-snug">{dealer.location}</span>
                    </p>
                  </div>
                </div>

                <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">
                  {dealer.description || "Partnering with BIDGARI to provide verified vehicles and transparent buyer contact."}
                </p>

                <div
                  className="mt-auto flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <UnitCount count={count} />
                  <span
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-[var(--accent)] bg-transparent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-zinc-950"
                    style={{ borderRadius }}
                  >
                    Visit showroom
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </TrackedLink>
            );
          })}
        </div>

        <div
          className="mt-10 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:p-8"
          style={{ borderRadius }}
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-zinc-950 shadow-sm">
              <Handshake className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Grow with us
              </p>
              <p className="mt-1 text-base font-semibold leading-snug text-slate-900">
                Want to partner with BIDGARI? Join our network of trusted dealerships and reach serious buyers.
              </p>
            </div>
          </div>
          <TrackedLink
            href="/contact"
            eventName="homepage_partner_cta_click"
            eventPayload={{ area: "become_partner" }}
            className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-[var(--accent)] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-emerald-500"
            style={{ borderRadius }}
          >
            Become a partner
            <ArrowRight className="h-4 w-4" aria-hidden />
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
