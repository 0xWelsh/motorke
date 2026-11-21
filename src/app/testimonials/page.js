import Link from "next/link";
import { Quote, Star, Users, ShoppingBag, ShieldCheck } from "lucide-react";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";
import { db } from "@/lib/db";
import { getSiteOrigin } from "@/lib/site-url";
import Script from "next/script";

export const dynamic = "force-dynamic";

export const metadata = {
  title: buildPageTitle("Testimonials"),
  description:
    "Read what BIDGARI customers say — real reviews from verified buyers on their car-buying experience in Kenya.",
  ...buildCanonicalMetadata("/testimonials"),
  openGraph: {
    title: "Testimonials | BIDGARI",
    description:
      "Real reviews from verified BIDGARI customers across Kenya.",
    type: "website",
  },
};

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Stars({ rating }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <span key={index} className={index <= rating ? "text-amber-500" : "text-ghost"}>
          ★
        </span>
      ))}
    </span>
  );
}

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-sm font-bold text-[var(--accent)]">
      {initials}
    </div>
  );
}

export default async function TestimonialsPage() {
  const carReviews = await db.carReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true } },
        car: { select: { make: true, model: true, year: true, publicSlug: true } },
      },
    });

  const all = [
    ...carReviews.map((r) => ({
      id: `c-${r.id}`,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      author: r.user?.name || "BIDGARI customer",
      targetLabel: r.car
        ? `${r.car.year} ${r.car.make} ${r.car.model}`
        : "Verified listing",
      href: r.car?.publicSlug ? `/cars/${r.car.publicSlug}` : null,
      type: "car",
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const ratings = all.map((r) => r.rating);
  const total = ratings.length;
  const average = total ? (ratings.reduce((sum, r) => sum + r, 0) / total).toFixed(1) : null;
  const fiveStar = total ? ratings.filter((r) => r === 5).length : 0;

  const stats = [
    { icon: Users, label: "Total reviews", value: String(total) },
    { icon: Star, label: "Average rating", value: average ? `${average} / 5` : "—" },
    { icon: ShieldCheck, label: "5-star reviews", value: String(fiveStar) },
  ];

  return (
    <div className="bg-[var(--bg)] min-h-screen">
      {total > 0 && (
        <Script
          id="testimonials-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BIDGARI",
              url: getSiteOrigin(),
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: average,
                reviewCount: total,
                bestRating: 5,
                worstRating: 1,
              },
              review: all.slice(0, 20).map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.author },
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: r.rating,
                  bestRating: 5,
                },
                reviewBody: r.comment || "",
                datePublished: new Date(r.createdAt).toISOString(),
              })),
            }),
          }}
        />
      )}
      {/* Header */}
      <section className="border-b border-border bg-[var(--bg)] px-6 pt-32 pb-20 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-8">
            <span>Community</span>
            <span>/</span>
            <span className="text-text">Testimonials</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-text tracking-tight leading-[1.05] mb-6">
            Real buyers. <br />
            <span className="text-muted">Real experiences.</span>
          </h1>
          <p className="text-lg text-muted font-medium max-w-2xl leading-relaxed">
            Verified reviews from BIDGARI customers across Kenya — on the vehicles
            they bought and the teams that served them.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-[var(--accent)]">
                  <s.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-2xl font-black text-text">{s.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-dim">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          {total === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-16 text-center">
              <Quote className="mx-auto h-8 w-8 text-ghost" />
              <p className="mt-6 text-lg font-bold text-text">No reviews yet</p>
              <p className="mt-2 text-sm text-muted">
                Reviews from BIDGARI customers will appear here as they come in.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {all.map((r) => (
                <article key={r.id} className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Stars rating={r.rating} />
                    <span className="text-[11px] font-semibold text-dim">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="relative mt-4 flex-1">
                    <Quote className="absolute -left-1 -top-1 h-6 w-6 text-ghost" />
                    <p className="relative pl-5 text-sm leading-relaxed text-muted">
                      {r.comment || "No written comment."}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-3 border-t border-subtle pt-4">
                    <Avatar name={r.author} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text">{r.author}</p>
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3 w-3 shrink-0 text-ghost" />
                        <span className="truncate text-xs font-medium text-muted">
                          <Link href={r.href || "#"} className="text-[var(--accent)] hover:underline">
                            {r.targetLabel}
                          </Link>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-text">
            Ready to find your next car?
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/cars" className="btn btn-primary btn-lg">
              Browse inventory
            </Link>
            <Link href="/how-to-buy" className="btn btn-outline btn-lg">
              How to buy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
