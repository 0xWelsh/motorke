import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { getSupportWhatsAppHref } from "@/lib/site-contact";

// Attention-capture hero message: the H1 the homepage was missing, a one-line
// trust promise, and two primary actions. Lives above the search + carousel so
// the value proposition lands before the product rotation.
export default function HomepageHeroMessage() {
  const whatsappHref = getSupportWhatsAppHref();

  return (
    <section className="pt-5 sm:pt-7" aria-labelledby="homepage-hero-heading">
      <p className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
        Kenya&apos;s verified car marketplace
      </p>
      <h1
        id="homepage-hero-heading"
        className="mt-2 text-[clamp(1.75rem,6vw,2.75rem)] font-black leading-[1.05] tracking-tight text-text"
      >
        Buy a verified car in Kenya
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
        Every listing is inspected and priced fairly. Every sale is handled end-to-end by one
        trusted BIDGARI team — so you never pay a deposit to a private number.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <TrackedLink
          href="/cars"
          eventName="hero_browse_click"
          eventPayload={{ area: "hero" }}
          className="btn btn-primary btn-lg"
        >
          Browse cars <ArrowRight className="h-4 w-4" aria-hidden />
        </TrackedLink>
        {whatsappHref && (
          <TrackedLink
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            eventName="hero_whatsapp_click"
            eventPayload={{ area: "hero" }}
            className="btn btn-success btn-lg"
          >
            WhatsApp a consultant
          </TrackedLink>
        )}
        <Link
          href="/how-to-buy"
          className="text-sm font-bold text-muted underline-offset-4 hover:text-[var(--accent)] hover:underline"
        >
          How buying works
        </Link>
      </div>
    </section>
  );
}