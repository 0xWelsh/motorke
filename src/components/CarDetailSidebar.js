"use client";
import { MapPin, Phone, ShieldCheck, Clock, Building2, Sparkles } from "lucide-react";
import ListingPriceBlock from "@/components/ListingPriceBlock";
import EnquiryForm from "@/components/EnquiryForm";
import { CompareButton } from "@/components/CompareSelector";

export default function CarDetailSidebar({
  car,
  dealer,
  title,
  titleWithoutYear,
  whatsappHref,
  callHref,
  waDigits,
  session,
  listingUrl,
  priceLabel,
  locationLabel,
  primaryImg,
  dealerCarCount = 0,
}) {
  const verified = dealer.verificationStatus === "VERIFIED";
  const carCount = dealerCarCount;
  const yearsOnPlatform = dealer.createdAt
    ? Math.floor((Date.now() - new Date(dealer.createdAt).getTime()) / (365.25 * 86400000))
    : 0;

  return (
    <aside className="space-y-4">
      {/* Price + Contact Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {/* Price */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <ListingPriceBlock car={car} explainerId="car-price-explainer" />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Available
            </span>
            {verified && (
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Dealer
              </span>
            )}
          </div>
        </div>

        {/* WhatsApp + Call */}
        <div className="px-5 py-4 space-y-2.5">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#25D366] text-white px-4 py-3.5 text-sm font-bold hover:bg-[#20bd5a] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          {callHref && (
            <a
              href={callHref}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-white px-4 py-3.5 text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call Dealer
            </a>
          )}
        </div>

        {/* Quick actions */}
        {whatsappHref && (
          <div className="px-5 pb-4 space-y-1.5">
            {[
              { label: "Is this available?", msg: `Hi, is the ${title} still available?` },
              { label: "Make an offer", msg: `Hi, I'd like to make an offer on the ${title}` },
              { label: "Request inspection", msg: `Hi, I'd like to arrange an inspection for the ${title}` },
            ].map((item) => (
              <a
                key={item.label}
                href={waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(item.msg)}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-[11px] font-bold tracking-wide text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#25D366]" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {item.label}
              </a>
            ))}
          </div>
        )}

        {/* Extra actions */}
        <div className="px-5 pb-5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-2">
            <CompareButton
              car={{
                id: car.id,
                year: car.year,
                make: car.make,
                model: `${car.make} ${car.model}`,
                price: car.price,
                image: primaryImg?.url,
              }}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            />
            <button
              type="button"
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Calculate Duty
            </button>
          </div>
        </div>
      </div>

      {/* Dealer Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
            {dealer.logo ? (
              <img src={dealer.logo} alt={dealer.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{dealer.name}</h3>
              {verified && (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              {yearsOnPlatform > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {yearsOnPlatform} yr{yearsOnPlatform !== 1 ? "s" : ""}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {carCount} car{carCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{locationLabel}</span>
        </div>
        {dealer.slug && (
          <a
            href={`/showrooms/${dealer.slug}`}
            className="mt-3 w-full inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            View inventory →
          </a>
        )}
      </div>

      {/* Safety tips */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Safety tips</h4>
        <ul className="space-y-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <li className="flex gap-2">
            <span className="text-emerald-500 shrink-0">•</span>
            Inspect the vehicle in person before paying
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 shrink-0">•</span>
            Never send money via M-Pesa to strangers
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 shrink-0">•</span>
            Meet at a safe, public location
          </li>
        </ul>
      </div>
    </aside>
  );
}
