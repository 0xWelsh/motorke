"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ImageOff, X, Heart, Share2, Clock, Copy, Check, MoreHorizontal, MessageCircle } from "lucide-react";
import PictureImage from "@/components/PictureImage";
import CardMosaic from "@/components/card/CardMosaic";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { useSaveData } from "@/components/SaveDataProvider";
import { useSavedCars } from "@/components/SavedCarsProvider";
import { trackUiEvent } from "@/lib/analytics";
import { carListingPath } from "@/lib/car-listing-url";
import { isActiveSpotlight } from "@/lib/spotlight";
import { buildFacebookSharerUrl } from "@/lib/share-helpers";
import { getListingBoostVisuals } from "@/lib/listing-boost-visuals";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";
import { clsx } from "clsx";
import { CarNavPendingSignal } from "@/components/CarNavPending";
import AdminCardControls from "@/components/AdminCardControls";
import { useAuthModal } from "@/components/AuthModalProvider";
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
  "(max-width: 640px) 100vw, 48vw";

// Homepage one-column feed: full column width on phones, ~720px on desktop.
const FEED_SIZES = "(max-width: 1024px) 100vw, 720px";

const titleCase = (s) =>
  String(s || "").replace(/\S+/g, (word) =>
    word
      .split("-")
      .map((part) =>
        part === part.toUpperCase() && part.length > 1
          ? part
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
      )
      .join("-"),
  );

// Short body-style words for the spec sentence — BODY_TYPE_LABELS is
// built for filter chips ("SUV / 4x4") and too chatty inside a line.
const BODY_SHORT = {
  SEDAN: "Sedan", SUV: "SUV", HATCHBACK: "Hatchback", PICKUP: "Pickup",
  VAN: "Van", WAGON: "Wagon", COUPE: "Coupe", CROSSOVER: "Crossover",
  MPV: "MPV", MINIVAN: "Minivan", CONVERTIBLE: "Convertible",
  ROADSTER: "Roadster", TRUCK: "Truck",
};

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
  featured = false,
}) {
  const spotlightActive = showSpotlight || isActiveSpotlight(car) || spotlightProminent;
  const isList = layout === "list";
  const isFeed = layout === "feed";
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
        className="group flex items-stretch bg-surface border overflow-hidden transition-colors duration-300"
        style={{ borderColor, touchAction: "manipulation" }}
      >
        <Link
          href={carListingPath(car)}
          onClick={() => onCarClick("card_compact")}
          className="flex w-full items-center gap-2.5 p-2"
        >
          <div className={`relative h-[52px] w-[84px] sm:h-16 sm:w-28 shrink-0 overflow-hidden rounded-md bg-surface-overlay${sold ? " grayscale" : ""}`}>
            {primaryImg ? (
              <PictureImage
                src={primaryImg}
                alt={`${car.year} ${car.make} ${car.model}`}
                priority={priority}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="120px"
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-ghost">
                    <ImageOff className="h-5 w-5" aria-hidden />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ghost">
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
            <p className="truncate text-[11px] leading-snug text-muted">
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
        className="group flex flex-col bg-surface border overflow-hidden transition-colors duration-300"
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
            className={`relative w-[42%] shrink-0 sm:w-64 aspect-[4/3] overflow-hidden bg-surface-overlay${sold ? " grayscale" : ""}`}
          >
            {primaryImg ? (
              <PictureImage
                src={primaryImg}
                alt={`${car.year} ${car.make} ${car.model}`}
                priority={priority}
                className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover:brightness-110"
                sizes={sizes || "(max-width: 768px) 42vw, 16vw"}
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-ghost">
                    <ImageOff className="h-7 w-7" aria-hidden />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ghost">
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
                className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded bg-glass/90 text-muted transition-colors hover:bg-surface hover:text-red-600 sm:h-7 sm:w-7"
                aria-label="Remove from watchlist"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <AdminCardControls car={car} />
          </div>
          <div className="flex flex-1 flex-col gap-y-1 min-w-0 p-2.5 md:p-3">
            <h3
              className="line-clamp-1 text-[15px] font-extrabold leading-tight tracking-tight text-text"
              title={`${car.make} ${car.model}${car.variant ? ` (${car.variant})` : ""}`}
            >
              {[car.year, make, model].filter(Boolean).join(" ")}
            </h3>
            <p className="mt-1 text-[16px] font-black leading-snug tracking-tight text-[var(--accent)]">
              {formatCarPrice(car)}
            </p>
            <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-text">
              {[car.mileage != null ? formatMileage(car.mileage) : null, transLabel || null, fuelLabel || null]
                .filter(Boolean)
                .join(", ")}
            </p>
            {(car.location || distanceLabel) && (
              <p className="flex min-w-0 items-center gap-1 text-[12px] leading-snug text-muted">
                <MapPin className="h-3 w-3 shrink-0 text-dim" aria-hidden />
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
      sizes={sizes || (isFeed ? FEED_SIZES : undefined)}
      feed={isFeed}
      featured={featured}
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
  feed = false,
  featured = false,
  titleHtml,
  onCarClick,
  eventPayload,
  router,
}) {
  const { isSaved, toggle } = useSavedCars();
  const { openAuthModal } = useAuthModal();
  const saved = isSaved(car.id);
  const [copied, setCopied] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState(null);

  const cardSizes = sizes || GRID_SIZES;

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
  // "2 Days" pill on the image, like C&B's countdown chip — ours reads as
  // time on market (0 days shows "Today").
  const daysOnMarket =
    listedDays == null
      ? null
      : listedDays < 1
        ? "Today"
        : `${Math.floor(listedDays)} Day${Math.floor(listedDays) > 1 ? "s" : ""}`;

  // Top-right pills, C&B order of loudness. Max 2 — the strip owns the
  // bottom of the image, so the corner stays calm.
  const badges = [];
  if (boost.spotlight || featured)
    badges.push({ key: "feat", label: "Featured", cls: "bg-glass/90 text-text tracking-[0.14em]" });
  else if (boost.hot) badges.push({ key: "hot", label: "Hot", cls: "bg-red-600/95 text-white" });
  if (listedDays != null && listedDays <= 7)
    badges.push({ key: "new", label: "New", cls: "bg-emerald-600/95 text-white" });
  if (car.condition === "NEW")
    badges.push({ key: "brand", label: "Brand new", cls: "bg-glass/85 text-text" });
  const shownBadges = badges.slice(0, 2);

  // One comma-separated spec sentence, like C&B's option list — richer than
  // before: power, engine, drive, gearbox, fuel, mileage, colour.
  const specSentence = [
    car.horsepower ? `${car.horsepower}-hp` : null,
    car.engineCC ? `${Number(car.engineCC).toLocaleString("en-KE")} cc` : null,
    car.drivetrain ? String(car.drivetrain).toUpperCase() : null,
    car.transmission === "AUTOMATIC" ? "Automatic" : car.transmission === "MANUAL" ? "Manual" : car.transmission || null,
    fuelLabel || null,
    car.mileage != null ? formatMileage(car.mileage) : null,
    car.color ? titleCase(car.color) : null,
  ]
    .filter(Boolean)
    .join(", ");

  const locationLabel = [car.location || car.dealer?.location, distanceLabel]
    .filter(Boolean)
    .join(" · ");


  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    trackUiEvent(saved ? "unsave_car" : "save_car", eventPayload);
    const needsLogin = await toggle(car.id);
    if (needsLogin) {
      openAuthModal("login", { next: carListingPath(car) });
    }
  }

  const listingHref = carListingPath(car);

  // Quick-share popover: WhatsApp + Facebook carry the link, and both pull
  // the listing's OG preview (cover photo + price) — no extra work here.
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return;
    const onDown = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setShareOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  function shareLink() {
    return new URL(carListingPath(car), window.location.origin).href;
  }

  function shareTitle() {
    return `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} — ${formatCarPrice(car)}`;
  }

  function shareWhatsApp(e) {
    e.preventDefault();
    e.stopPropagation();
    const text = encodeURIComponent(`${shareTitle()}\n\n${shareLink()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  }

  function shareFacebook(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = buildFacebookSharerUrl(shareLink());
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  }

  function shareCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(shareLink()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
    setShareOpen(false);
  }

  function shareMore(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator.share === "function") {
      navigator
        .share({ title: shareTitle(), url: shareLink() })
        .catch(() => {});
    }
    setShareOpen(false);
  }

  // Name line: year make model variant + body type, like "2017 Mercedes-Benz
  // S63 AMG Sedan". Skips the body word when the variant already ends with it.
  const bodyShort = car.bodyType
    ? BODY_SHORT[String(car.bodyType).toUpperCase()] || titleCase(String(car.bodyType).toLowerCase())
    : null;
  const titleWords = [car.year, make, model].filter(Boolean).join(" ");
  const titleWithBody =
    bodyShort && !String(model || "").toLowerCase().endsWith(bodyShort.toLowerCase())
      ? `${titleWords} ${bodyShort}`
      : titleWords;

  return (
    <article className="group relative flex flex-col">
      <Link
        href={listingHref}
        onClick={() => onCarClick("card")}
        className="block"
      >
        <div
          className={clsx(
            "relative w-full overflow-hidden bg-surface-overlay rounded-xl",
            feed ? "aspect-[16/9]" : "aspect-[16/10]",
            boost.spotlight ? "ring-1 ring-slate-900/15" : "",
            sold && "grayscale",
          )}
        >
          {slides.length > 1 ? (
            <CardMosaic
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
                <div className="flex h-full w-full items-center justify-center text-ghost">
                  <ImageOff className="h-7 w-7" aria-hidden />
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ghost">
              <ImageOff className="h-7 w-7" />
            </div>
          )}

          {/* Days pill + price, on the image's bottom-left over a scrim —
              C&B's bid-bar layout without the bid. */}
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2.5 pb-2 pt-8">
            {daysOnMarket && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                <Clock className="h-3 w-3" aria-hidden />
                {daysOnMarket}
              </span>
            )}
            <span className={clsx("min-w-0 truncate font-bold tabular-nums tracking-tight text-white", feed ? "text-[15px]" : "text-[13.5px]")}>
              {formatCarPrice(car)}
            </span>
            {car.negotiable === true && (
              <span className="ml-auto shrink-0 text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/75">
                Negotiable
              </span>
            )}
          </div>

          {shownBadges.length > 0 && (
            <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
              {shownBadges.map((b) => (
                <span
                  key={b.key}
                  className={clsx(
                    "rounded-md px-2 py-1 text-[9.5px] font-black uppercase tracking-[0.1em] backdrop-blur-sm",
                    b.cls,
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {sold && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-slate-900/85 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
              Sold
            </span>
          )}
          <CarNavPendingSignal />
        </div>
      </Link>

      <div className="flex items-start justify-between gap-1.5 px-1 pt-2.5 pb-0.5">
        <Link
          href={listingHref}
          onClick={() => onCarClick("card_text")}
          className="min-w-0 flex-1"
        >
          <h3
            className={clsx(
              "line-clamp-2 font-bold leading-snug tracking-tight text-text",
              feed ? "text-[18px]" : "text-[15px]",
            )}
            title={`${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`}
          >
            {titleHtml || titleWithBody}
          </h3>

          {specSentence && (
            <p className={clsx("mt-1 line-clamp-2 font-medium leading-relaxed text-muted", feed ? "text-[14px]" : "text-[13px]")}>
              {specSentence}
            </p>
          )}

          {locationLabel && (
            <p className={clsx("mt-1.5 font-medium text-dim", feed ? "text-[13.5px]" : "text-[12.5px]")}>{locationLabel}</p>
          )}
        </Link>

        {/* Actions beside the title, off the image (C&B star placement). */}
        <div className="flex shrink-0 flex-col items-center">
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(car.id);
              }}
              aria-label="Remove from watchlist"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-dim transition-colors hover:text-red-600"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save this car"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-dim transition-colors hover:text-text"
          >
            <Heart className={clsx("h-[18px] w-[18px]", saved && "fill-slate-900 text-text")} />
          </button>
          <div ref={shareRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShareOpen((v) => !v);
              }}
              aria-haspopup="menu"
              aria-expanded={shareOpen}
              aria-label="Share this listing"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-dim transition-colors hover:text-text"
            >
              <Share2 className="h-[18px] w-[18px]" />
            </button>
            {shareOpen && (
              <div
                role="menu"
                className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-2xl"
              >
                <button type="button" role="menuitem" onClick={shareWhatsApp}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-bold text-secondary transition-colors hover:bg-surface-overlay hover:text-text">
                  <MessageCircle className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden /> WhatsApp
                </button>
                <button type="button" role="menuitem" onClick={shareFacebook}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-bold text-secondary transition-colors hover:bg-surface-overlay hover:text-text">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button type="button" role="menuitem" onClick={shareCopy}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-bold text-secondary transition-colors hover:bg-surface-overlay hover:text-text">
                  {copied ? <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden /> : <Copy className="h-4 w-4 shrink-0 text-dim" aria-hidden />}
                  {copied ? "Link copied" : "Copy link"}
                </button>
                <button type="button" role="menuitem" onClick={shareMore}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] font-bold text-secondary transition-colors hover:bg-surface-overlay hover:text-text">
                  <MoreHorizontal className="h-4 w-4 shrink-0 text-dim" aria-hidden /> More options
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
