"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ImageOff, X, Heart, Share2, BadgeCheck } from "lucide-react";
import PictureImage from "@/components/PictureImage";
import CardGallery from "@/components/card/CardGallery";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { useSaveData } from "@/components/SaveDataProvider";
import { useSavedCars } from "@/components/SavedCarsProvider";
import { trackUiEvent } from "@/lib/analytics";
import { carListingPath } from "@/lib/car-listing-url";
import { isActiveSpotlight } from "@/lib/spotlight";
import { getListingBoostVisuals } from "@/lib/listing-boost-visuals";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";
import { clsx } from "clsx";
import { CarNavPendingSignal } from "@/components/CarNavPending";
import AdminCardControls from "@/components/AdminCardControls";
import { useCarFlag } from "@/hooks/use-car-flag";

/**
 * Catalog car card.
 *
 * Grid layout is the premium treatment (Cars-and-Bids style): unframed
 * image with overlay badges + heart/share, then name, price, and one
 * dense meta line (mileage · engine · fuel · location). Spotlight listings
 * get an auto-advancing slideshow; everything else a static hero image.
 *
 * Compact and list layouts stay the dense catalog style used in
 * power-browsing views.
 */

// Every grid that renders this card is 2-up on mobile, so ~48vw is the true
// slot width there. Declaring that honestly is what lets phones select the
// 400w WebP (~25KB) instead of the 800w one (~100KB).
const GRID_SIZES =
  "(max-width: 640px) 48vw, (max-width: 1024px) 31vw, (max-width: 1536px) 24vw, 19vw";

const titleCase = (s) =>
  String(s || "").replace(/\S+/g, (word) =>
    word === word.toUpperCase() && word.length > 1
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );

export default function CarCard({
  car,
  distance = null,
  onRemove = null,
  showSpotlight = false,
  spotlightProminent = false,
  priority = false,
  titleHtml = null,
  layout = "grid",
  sizes,
}) {
  const spotlightActive = showSpotlight || isActiveSpotlight(car) || spotlightProminent;
  const isList = layout === "list";
  const saveData = useSaveData();
  const router = useRouter();
  // Instant admin overrides (mark sold / hide) applied before the server refresh
  // catches up, so the card reacts immediately.
  const soldFlag = useCarFlag(car.id, "sold");
  const hiddenFlag = useCarFlag(car.id, "hidden");
  const boost = getListingBoostVisuals(car, {
    spotlight: spotlightActive,
    prominent: spotlightProminent,
  });
  const primaryImg = car.images?.[0]?.url;
  const sold = soldFlag !== undefined ? Boolean(soldFlag) : !car.available || isInSoldGracePeriod(car);
  const make = titleCase(car.make);
  const model = titleCase(`${car.model || ""}${car.variant ? ` ${car.variant}` : ""}`).trim();
  const fuelLabel = FUEL_LABELS[car.fuelType] || car.fuelType || "";
  const transLabel =
    car.transmission === "AUTOMATIC" ? "Auto" : car.transmission === "MANUAL" ? "Manual" : car.transmission || "";
  const specBits = [
    car.year,
    car.mileage != null ? formatMileage(car.mileage) : null,
    fuelLabel || null,
    transLabel || null,
  ].filter(Boolean);
  const distanceKm = Number.isFinite(distance) ? distance : (Number.isFinite(car?.distance) ? car.distance : null);
  const distanceLabel =
    distanceKm == null
      ? null
      : distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(1)} km`;

  const borderColor = boost.spotlight && boost.hot
    ? "rgba(220,38,38,0.55)"
    : boost.spotlight
      ? "rgba(220,38,38,0.45)"
      : boost.hot
        ? "rgba(249,115,22,0.45)"
        : "#D8D8D8";

  const eventPayload = {
    car_id: car.id,
    dealer_id: car?.dealer?.id || "",
    make: car.make || "",
    model: car.model || "",
    price: Number(car.price || 0),
  };

  function onCarClick(placement) {
    trackUiEvent("view_car_click", {
      ...eventPayload,
      placement,
    });
  }

  if (hiddenFlag) return null;

  // Compact row: tiny thumbnail + one-line title + price/specs inline. Fits
  // ~2-3x more cars per screen than the grid for power browsing.
  if (layout === "compact") {
    return (
      <article
        className="group flex items-stretch bg-white border overflow-hidden transition-colors duration-300"
        style={{ borderColor, touchAction: "manipulation" }}
      >
        <Link
          href={carListingPath(car)}
          onClick={() => onCarClick("card_compact")}
          className="flex w-full items-center gap-2.5 p-2"
        >
          <div className={`relative h-[52px] w-[84px] sm:h-16 sm:w-28 shrink-0 overflow-hidden rounded-md bg-slate-100${sold ? " grayscale" : ""}`}>
            {primaryImg ? (
              <PictureImage
                src={primaryImg}
                alt={`${car.year} ${car.make} ${car.model}`}
                priority={priority}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="120px"
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageOff className="h-5 w-5" aria-hidden />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageOff className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-bold italic leading-tight text-[var(--brand-navy)]">
              {make} {model}
            </h3>
            <p className="mt-0.5 whitespace-nowrap text-[15px] font-bold leading-snug text-[var(--accent)]">
              {formatCarPrice(car)}
            </p>
            <p className="truncate text-[11px] leading-snug text-slate-500">
              {[...specBits, car.location ? car.location : null, distanceLabel ? distanceLabel : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <CarNavPendingSignal />
        </Link>
      </article>
    );
  }

  // Classic bordered row used in a few comparison/dealer views.
  if (isList) {
    return (
      <article
        className="group flex flex-col bg-white border overflow-hidden transition-colors duration-300"
        style={{ borderColor, touchAction: "manipulation" }}
        {...(boost.active
          ? {
              "data-boost": boost.spotlight && boost.hot ? "spotlight-hot" : boost.spotlight ? "spotlight" : "hot",
            }
          : {})}
      >
        <Link
          href={carListingPath(car)}
          onClick={() => onCarClick("card_list")}
          className="flex"
        >
          <div
            className={`relative w-[42%] shrink-0 sm:w-64 aspect-[4/3] overflow-hidden bg-slate-100${sold ? " grayscale" : ""}`}
          >
            {primaryImg ? (
              <PictureImage
                src={primaryImg}
                alt={`${car.year} ${car.make} ${car.model}`}
                priority={priority}
                className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover:brightness-110"
                sizes={sizes || "(max-width: 768px) 42vw, 16vw"}
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageOff className="h-7 w-7" aria-hidden />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageOff className="h-7 w-7" />
              </div>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onRemove(car.id);
                }}
                className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded bg-white/90 text-slate-600 transition-colors hover:bg-white hover:text-red-600 sm:h-7 sm:w-7"
                aria-label="Remove from watchlist"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <AdminCardControls car={car} />
          </div>
          <div className="flex flex-1 flex-col gap-y-1 min-w-0 p-2.5 md:p-3">
            <h3
              className="line-clamp-1 text-[15px] font-extrabold leading-tight tracking-tight text-slate-900"
              title={`${car.make} ${car.model}${car.variant ? ` (${car.variant})` : ""}`}
            >
              {[car.year, make, model].filter(Boolean).join(" ")}
            </h3>
            <p className="mt-1 text-[16px] font-black leading-snug tracking-tight text-[var(--accent)]">
              {formatCarPrice(car)}
            </p>
            <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">
              {[car.mileage != null ? formatMileage(car.mileage) : null, transLabel || null, fuelLabel || null]
                .filter(Boolean)
                .join(", ")}
            </p>
            {(car.location || distanceLabel) && (
              <p className="flex min-w-0 items-center gap-1 text-[12px] leading-snug text-slate-500">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                <span className="min-w-0 truncate">
                  {[car.location, distanceLabel].filter(Boolean).join(" · ")}
                </span>
              </p>
            )}
            <CarNavPendingSignal />
          </div>
        </Link>
        <div className="flex items-stretch border-t" style={{ borderColor }}>
          <Link
            href={carListingPath(car)}
            onClick={() => onCarClick("card_detail")}
            className="flex flex-1 items-center justify-center bg-[var(--accent)] px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            View Details
          </Link>
        </div>
      </article>
    );
  }

  return (
    <PremiumGridCard
      car={car}
      boost={boost}
      sold={sold}
      primaryImg={primaryImg}
      make={make}
      model={model}
      fuelLabel={fuelLabel}
      distanceLabel={distanceLabel}
      onRemove={onRemove}
      priority={priority}
      sizes={sizes}
      titleHtml={titleHtml}
      onCarClick={onCarClick}
      eventPayload={eventPayload}
      router={router}
    />
  );
}

function PremiumGridCard({
  car,
  boost,
  sold,
  primaryImg,
  make,
  model,
  fuelLabel,
  distanceLabel,
  onRemove,
  priority,
  sizes,
  titleHtml,
  onCarClick,
  eventPayload,
  router,
}) {
  const { isSaved, toggle } = useSavedCars();
  const saved = isSaved(car.id);
  const [copied, setCopied] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState(null);

  const cardSizes = sizes || GRID_SIZES;
  const dealerVerified =
    car.dealer?.verified === true || car.dealer?.verificationStatus === "VERIFIED";

  // Spotlight cards pull the full image set lazily; other cards never pay
  // for it. Payloads that already ship several images (homepage featured)
  // use them directly.
  useEffect(() => {
    if (!boost.spotlight) return;
    if ((car.images?.length || 0) > 1) return;
    let cancelled = false;
    fetch(`/api/cars/${car.id}/gallery`)
      .then((r) => (r.ok ? r.json() : { urls: [] }))
      .then((d) => {
        if (!cancelled && Array.isArray(d.urls) && d.urls.length > 1) setGalleryUrls(d.urls);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [boost.spotlight, car.id, car.images?.length]);

  const slides =
    (car.images?.length || 0) > 1
      ? car.images.map((i) => i.url).filter(Boolean)
      : galleryUrls || (primaryImg ? [primaryImg] : []);

  const listedDays = car.createdAt
    ? (Date.now() - new Date(car.createdAt).getTime()) / 86_400_000
    : null;

  const badges = [];
  if (boost.spotlight) badges.push({ key: "spot", label: "Spotlight", cls: "bg-slate-900/90 text-white" });
  else if (boost.hot) badges.push({ key: "hot", label: "Hot", cls: "bg-red-600/90 text-white" });
  if (listedDays != null && listedDays <= 7)
    badges.push({ key: "new", label: "New", cls: "bg-emerald-600/90 text-white" });
  if (car.condition === "NEW")
    badges.push({ key: "brand", label: "Brand new", cls: "bg-white/85 text-slate-900" });
  if (car.dutyPaid === true)
    badges.push({ key: "duty", label: "Duty paid", cls: "bg-white/85 text-emerald-700" });
  else if (car.dutyPaid === false)
    badges.push({ key: "duty", label: "Duty payable", cls: "bg-white/85 text-amber-700" });
  if (dealerVerified)
    badges.push({ key: "ver", label: "Verified", cls: "bg-white/85 text-slate-700", icon: BadgeCheck });
  if (car.negotiable === true)
    badges.push({ key: "neg", label: "Negotiable", cls: "bg-white/85 text-slate-600" });
  const shownBadges = badges.slice(0, 3);

  const metaBits = [
    car.mileage != null ? formatMileage(car.mileage) : null,
    car.engineCC ? `${Number(car.engineCC).toLocaleString("en-KE")} cc` : null,
    fuelLabel || null,
    car.location || car.dealer?.location || null,
    distanceLabel || null,
  ].filter(Boolean);

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = new URL(carListingPath(car), window.location.origin).href;
    const title = `${car.year} ${car.make} ${car.model} — BIDGARI`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed the sheet — clipboard fallback anyway
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  }

  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    trackUiEvent(saved ? "unsave_car" : "save_car", eventPayload);
    const needsLogin = await toggle(car.id);
    if (needsLogin) {
      router.push(`/login?next=${encodeURIComponent(carListingPath(car))}`);
    }
  }

  return (
    <article
      className="group relative flex flex-col"
      data-boost={boost.active ? (boost.spotlight && boost.hot ? "spotlight-hot" : boost.spotlight ? "spotlight" : "hot") : undefined}
    >
      <Link
        href={carListingPath(car)}
        onClick={() => onCarClick("card")}
        className="flex flex-col"
      >
        <div
          className={clsx(
            "relative aspect-[4/3] w-full overflow-hidden bg-slate-100 rounded-xl",
            boost.spotlight ? "ring-1 ring-slate-900/15" : "border border-slate-200",
            sold && "grayscale",
          )}
        >
          {slides.length > 1 ? (
            <CardGallery
              urls={slides}
              alt={`${car.year} ${car.make} ${car.model}`}
              sizes={cardSizes}
              priority={priority}
            />
          ) : primaryImg ? (
            <PictureImage
              src={primaryImg}
              alt={`${car.year} ${car.make} ${car.model}`}
              priority={priority}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              sizes={cardSizes}
              fallback={
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <ImageOff className="h-7 w-7" aria-hidden />
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImageOff className="h-7 w-7" />
            </div>
          )}

          {sold && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-slate-900/85 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
              Sold
            </span>
          )}
          <CarNavPendingSignal />
        </div>

        <div className="min-w-0 px-0.5 pt-2.5">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <h3
              className="line-clamp-2 min-w-0 text-[14.5px] font-bold leading-snug tracking-tight text-slate-900 sm:line-clamp-1 sm:truncate"
              title={`${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`}
            >
              {titleHtml || [car.year, make, model].filter(Boolean).join(" ")}
            </h3>
            <p className="shrink-0 text-[14.5px] font-bold tabular-nums tracking-tight text-slate-900">
              {formatCarPrice(car)}
            </p>
          </div>

          {metaBits.length > 0 && (
            <p className="mt-1 truncate text-[12.5px] font-medium tabular-nums text-slate-500">
              {metaBits.join(" · ")}
            </p>
          )}

          {car.dealer?.name && (
            <p className="mt-1 flex min-w-0 items-center gap-1 text-[11.5px] font-semibold text-slate-400">
              <span className="min-w-0 truncate">{car.dealer.name}</span>
              {dealerVerified && (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
              )}
            </p>
          )}
        </div>
      </Link>

      {/* Overlay badges — pointer-events-none so they never eat card clicks. */}
      {shownBadges.length > 0 && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[72%] flex-wrap gap-1">
          {shownBadges.map((b) => {
            const Icon = b.icon;
            return (
              <span
                key={b.key}
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em] backdrop-blur-sm",
                  b.cls,
                )}
              >
                {Icon && <Icon className="h-3 w-3" aria-hidden />}
                {b.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(car.id);
            }}
            aria-label="Remove from watchlist"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/60 bg-white/85 text-slate-500 shadow-sm backdrop-blur transition-colors hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save this car"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/60 bg-white/85 text-slate-500 shadow-sm backdrop-blur transition-colors hover:text-slate-900"
        >
          <Heart className={clsx("h-4 w-4", saved && "fill-slate-900 text-slate-900")} />
        </button>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share this listing"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/60 bg-white/85 text-slate-500 shadow-sm backdrop-blur transition-colors hover:text-slate-900"
        >
          <Share2 className="h-4 w-4" />
          {copied && (
            <span className="absolute right-0 top-9 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">
              Link copied
            </span>
          )}
        </button>
        <AdminCardControls car={car} />
      </div>
    </article>
  );
}
