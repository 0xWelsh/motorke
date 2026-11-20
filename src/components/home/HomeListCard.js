"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { carListingPath } from "@/lib/car-listing-url";
import { getThumbnailUrl } from "@/lib/image-transform";
import { trackUiEvent } from "@/lib/analytics";
import { FUEL_LABELS } from "@/lib/constants";
import { useSavedCars } from "@/components/SavedCarsProvider";

export default function HomeListCard({ car, priority = false }) {
  const router = useRouter();
  const { isSaved, toggle } = useSavedCars();
  const saved = isSaved(car.id);
  const imgUrl = car?.images?.[0]?.url ?? car?.image;
  const title = [car?.year, car?.make, car?.model, car?.variant].filter(Boolean).join(" ");

  const featureParts = [
    car?.mileage ? `${Number(car.mileage).toLocaleString("en-KE")} km` : null,
    car?.engineCC ? `${Number(car.engineCC).toLocaleString("en-KE")} cc` : null,
    car?.fuelType ? FUEL_LABELS[car.fuelType] || String(car.fuelType) : null,
    car?.location || car?.dealer?.location || null,
  ].filter(Boolean);
  const featuresText = featureParts.length ? featureParts.join(" · ") : null;

  const priceLabel = car?.price ? `KES ${Number(car.price).toLocaleString("en-KE")}` : "Contact for price";

  return (
    <article className="group">
      <Link
        href={carListingPath(car)}
        onClick={() =>
          trackUiEvent("homepage_list_card_click", {
            car_id: car.id,
            make: car.make,
            model: car.model,
          })
        }
        className="block"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-100">
          {imgUrl ? (
            <Image
              src={getThumbnailUrl(imgUrl, 1600)}
              alt={title}
              fill
              priority={priority}
              sizes="(min-width:1024px) 720px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-6xl font-black text-slate-200">{car?.make?.[0]}</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 rounded bg-black/90 px-2.5 py-1 text-sm font-black text-white shadow-sm">
            {priceLabel}
          </div>
        </div>
      </Link>

      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={carListingPath(car)}
            onClick={() =>
              trackUiEvent("homepage_list_card_click", {
                car_id: car.id,
                make: car.make,
                model: car.model,
              })
            }
            className="block"
          >
            <h3 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 sm:text-xl">
              {title || "View listing"}
            </h3>
          </Link>
          {featuresText && (
            <p className="mt-1 line-clamp-2 text-sm font-medium tabular-nums text-slate-500">
              {featuresText}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save this car"}
          onClick={async () => {
            trackUiEvent(saved ? "unsave_car" : "save_car", { car_id: car.id });
            const needsLogin = await toggle(car.id);
            if (needsLogin) router.push(`/login?next=${encodeURIComponent(carListingPath(car))}`);
          }}
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600"
        >
          <Heart className={`h-5 w-5 ${saved ? "fill-slate-900 text-slate-900" : ""}`} />
        </button>
      </div>
    </article>
  );
}

