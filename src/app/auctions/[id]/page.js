import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import AuctionHeader from "@/components/auction/AuctionHeader";
import AuctionGallery from "@/components/auction/AuctionGallery";
import BidPanel from "@/components/auction/BidPanel";
import AuctionInfo from "@/components/auction/AuctionInfo";
import AuctionTabs from "@/components/auction/AuctionTabs";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";

export const metadata = {
  title: "Auction | Motorke",
};

async function getAuctionData(id) {
  // For now, look up by car ID or publicSlug to demo the UI
  const car = await db.car.findFirst({
    where: { OR: [{ id }, { publicSlug: id }] },
    include: {
      images: { orderBy: { order: "asc" } },
      dealer: true,
    },
  });
  return car;
}

export default async function AuctionDetailPage({ params }) {
  const { id } = await params;
  const car = await getAuctionData(id);

  if (!car) notFound();

  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const subtitle = `${car.mileage ? formatMileage(car.mileage) + " • " : ""}${car.transmission ? TRANSMISSION_LABELS[car.transmission] || car.transmission : ""}${car.fuelType ? " • " + (FUEL_LABELS[car.fuelType] || car.fuelType) : ""}`;

  const infoItems = [
    { icon: "year", label: "Year", value: car.year },
    { icon: "mileage", label: "Mileage", value: car.mileage ? formatMileage(car.mileage) : "N/A" },
    { icon: "transmission", label: "Transmission", value: car.transmission ? (TRANSMISSION_LABELS[car.transmission] || car.transmission) : "N/A" },
    { icon: "fuel", label: "Fuel Type", value: car.fuelType ? (FUEL_LABELS[car.fuelType] || car.fuelType) : "N/A" },
    { icon: "location", label: "Location", value: car.location || car.dealer?.location || "Kenya" },
    { icon: "seller", label: "Seller", value: car.dealer?.name || "Dealer" },
  ];

  // Mock auction data - replace with real auction model later
  const auctionData = {
    currentBid: Math.floor(car.price * 0.7),
    bidCount: 12,
    endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    reserveMet: true,
    buyItNow: car.price,
  };

  const bidHistory = [
    { bidder: "Bidder #4821", amount: formatCarPrice({ price: auctionData.currentBid }), time: "2 hours ago" },
    { bidder: "Bidder #2934", amount: formatCarPrice({ price: Math.floor(auctionData.currentBid - 250000) }), time: "5 hours ago" },
    { bidder: "Bidder #7602", amount: formatCarPrice({ price: Math.floor(auctionData.currentBid - 500000) }), time: "1 day ago" },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <AuctionHeader title={title} subtitle={subtitle} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AuctionGallery images={car.images} />
            <AuctionInfo items={infoItems} />
            <AuctionTabs description={car.description || "No description provided."} bidHistory={bidHistory} />
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <BidPanel {...auctionData} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
