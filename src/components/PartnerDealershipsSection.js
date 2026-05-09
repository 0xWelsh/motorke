import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  Handshake,
  MapPin,
  ShieldCheck,
  Tag,
} from "lucide-react";
import TrackedLink from "@/components/TrackedLink";

const PARTNER_BG = "/images/backgrounds/car-dealership.jpg";

const PILLARS = [
  {
    title: "Verified dealers",
    description: "Every showroom is reviewed before they can list live inventory on the hub.",
    Icon: ShieldCheck,
  },
  {
    title: "Transparent pricing",
    description: "We prioritise listings where pricing and fees are stated clearly for buyers.",
    Icon: Tag,
  },
  {
    title: "Quality assured",
    description: "Cars are uploaded by the dealer — not scraped — so what you see reflects real stock.",
    Icon: BadgeCheck,
  },
];

function UnitCount({ count }) {
  const n = count ?? 0;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF2F7] text-[#276749] dark:bg-slate-800 dark:text-emerald-400">
        <Car className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-bold tabular-nums text-[#111827] dark:text-white">
          {n === 0 ? "0" : `${n}+`}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500">
          Units available
        </p>
      </div>
    </div>
  );
}

export default function PartnerDealershipsSection({ dealers }) {
  if (!dealers?.length) return null;

  const radius = "var(--radius)";

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 bg-[#F7FAFC] dark:bg-[#111111]">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(480px,44vw)] lg:block">
        <Image
          src={PARTNER_BG}
          alt=""
          fill
          className="object-cover opacity-[0.08] dark:opacity-[0.14]"
          sizes="(min-width: 1024px) 44vw, 0"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#F7FAFC] via-[#F7FAFC]/90 to-transparent dark:from-[#111111] dark:via-[#111111]/92" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-[min(90vw,1600px)]">
        <div className="mx-auto mb-10 max-w-3xl text-center lg:mb-12">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C6F6D5] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#276749] shadow-sm dark:border-emerald-900/50 dark:bg-zinc-900 dark:text-emerald-400">
            <Handshake className="h-3.5 w-3.5" aria-hidden />
            Trusted partners
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#111827] dark:text-white sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            <span className="text-[#111827] dark:text-white">Partner </span>
            <span className="text-[#2F855A] dark:text-emerald-400">Dealerships</span>
          </h2>
          <p className="text-base font-medium leading-relaxed text-[#718096] dark:text-slate-400 sm:text-lg">
            We work exclusively with certified dealerships that meet our standards for verification,
            pricing transparency, and how inventory is presented to buyers.
          </p>
        </div>

        <div className="mx-auto mb-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 lg:mb-14">
          {PILLARS.map(({ title, description, Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#E2E8F0] bg-white/80 p-5 text-center shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-zinc-900/80 sm:text-left"
              style={{ borderRadius }}
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E6FFFA] text-[#276749] dark:bg-emerald-950/50 dark:text-emerald-400 sm:mx-0">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-[#2F855A] dark:text-emerald-400">{title}</h3>
              <p className="text-sm leading-relaxed text-[#718096] dark:text-slate-400">{description}</p>
            </div>
          ))}
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
                  "group relative flex h-full flex-col overflow-visible bg-white dark:bg-zinc-900",
                  "border p-5 pt-7 transition-all hover:shadow-xl sm:p-6 sm:pt-8",
                  isFeatured
                    ? "z-[1] border-[#38A169] shadow-md ring-2 ring-[#38A169]/35 dark:border-emerald-500 dark:ring-emerald-500/30"
                    : "border-[#E2E8F0] dark:border-slate-800",
                ].join(" ")}
                style={{ borderRadius }}
              >
                {isFeatured && (
                  <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#2F855A] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-md dark:bg-emerald-600">
                      <span className="text-amber-300" aria-hidden>
                        ★
                      </span>
                      Featured dealer
                    </span>
                  </div>
                )}

                <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
                  {dealer.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#C6F6D5] bg-[#F0FFF4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#276749] dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#64748B] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Partner
                    </span>
                  )}
                </div>

                <div className="mb-4 flex items-start gap-4 pr-16 sm:pr-20">
                  <div
                    className="relative h-16 w-16 shrink-0 overflow-hidden border border-[#EDF2F7] bg-white dark:border-slate-800 dark:bg-zinc-950"
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
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-[#111827] dark:text-white">
                        {dealer.name?.[0] ?? "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="mb-1 break-words text-lg font-bold text-[#111827] transition-colors group-hover:text-[#38A169] dark:text-white dark:group-hover:text-emerald-400">
                      {dealer.name}
                    </h3>
                    <p className="flex items-start gap-1.5 text-xs font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                      <span className="leading-snug">{dealer.location}</span>
                    </p>
                  </div>
                </div>

                <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-[#4A5568] dark:text-slate-300">
                  {dealer.description || "Partnering with Welsh Motorhub to provide verified vehicles and transparent buyer contact."}
                </p>

                <div
                  className="mt-auto flex flex-col gap-4 border-t border-[#EDF2F7] pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <UnitCount count={count} />
                  <span
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-[#38A169] bg-transparent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#276749] transition-colors group-hover:bg-[#38A169] group-hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:group-hover:bg-emerald-500 dark:group-hover:text-zinc-950"
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
          className="mt-10 flex flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-[#EDF2F7]/60 p-6 dark:border-slate-800 dark:bg-zinc-900/60 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:p-8"
          style={{ borderRadius }}
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#38A169] text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950">
              <Handshake className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500">
                Grow with us
              </p>
              <p className="mt-1 text-base font-semibold leading-snug text-[#111827] dark:text-white">
                Want to partner with Welsh Motorhub? Join our network of trusted dealerships and reach serious buyers.
              </p>
            </div>
          </div>
          <TrackedLink
            href="/contact"
            eventName="homepage_partner_cta_click"
            eventPayload={{ area: "become_partner" }}
            className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-[#2F855A] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#276749] dark:bg-emerald-600 dark:hover:bg-emerald-500"
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
