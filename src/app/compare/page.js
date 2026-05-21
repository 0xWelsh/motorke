import { db } from "@/lib/db";
import CompareClient from "./CompareClient";

export const metadata = {
  title: "Compare cars side by side (Kenya)",
  description:
    "Compare up to three Kenyan vehicle listings side by side: price, specs, duties, efficiency, and running costs on Welsh Motorhub.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare vehicles | Welsh Motorhub",
    description:
      "Stack two or three Kenyan listings beside each other before you enquire. Built for decisive buyers.",
    type: "website",
    url: "/compare",
  },
};

export default async function ComparePage({ searchParams }) {
  const sp = await searchParams;
  const idsInUrl = [sp.a, sp.b, sp.c].filter(Boolean);

  const cars = idsInUrl.length > 0
    ? await db.car.findMany({
        where:   { id: { in: idsInUrl }, available: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { name: true, slug: true, location: true, verified: true } },
        },
      })
    : [];

  // Sort by the order they were requested in URL
  const orderedCars = idsInUrl.map((id) => cars.find((c) => c.id === id)).filter(Boolean);

  return <CompareClient initialCars={orderedCars} />;
}

