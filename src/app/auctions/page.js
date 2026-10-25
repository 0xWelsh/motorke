import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { absoluteMediaUrl } from "@/lib/site-url";
import { Clock, Gavel } from "lucide-react";

export const metadata = {
  title: "Auctions | Motorke",
  description: "Browse live car auctions on Motorke",
};

function getTimeLeft(endsAt) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

export default async function AuctionsPage() {
  const cars = await db.car.findMany({
    where: { available: true },
    include: { images: { orderBy: { order: "asc" }, take: 1 }, dealer: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text)]">
            Live Auctions
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Bid on great vehicles from trusted dealers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cars.map((car) => {
            const img = car.images[0];
            const endsAt = new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString();
            const currentBid = Math.floor(car.price * (0.65 + Math.random() * 0.25));
            const bidCount = Math.floor(Math.random() * 30) + 1;
            
            return (
              <Link
                key={car.id}
                href={`/auctions/${car.publicSlug || car.id}`}
                className="group rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden hover:shadow-lg hover:border-[var(--card-border-hover)] transition-all"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {img ? (
                    <Image
                      src={absoluteMediaUrl(img.url)}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--surface-overlay)]" />
                  )}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {getTimeLeft(endsAt)}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
                      {car.mileage ? formatMileage(car.mileage) : ""}{car.mileage && car.transmission ? " • " : ""}{car.transmission || ""}
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Current Bid</p>
                      <p className="text-xl font-extrabold tabular-nums text-[var(--text)]">
                        {formatCarPrice({ price: currentBid })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 justify-end">
                        <Gavel className="w-3 h-3" />
                        {bidCount} bids
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
