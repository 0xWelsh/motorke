import { db } from "@/lib/db";

const IN_HOUSE_NAME = "Welsh Motorhub";
const IN_HOUSE_SLUG = "welsh-motorhub";

export async function getOrCreateInHouseDealer() {
  const existing = await db.dealer.findFirst({ where: { slug: IN_HOUSE_SLUG } });
  if (existing) {
    if (existing.verificationStatus !== "VERIFIED" || existing.featured !== true) {
      await db.dealer.update({
        where: { id: existing.id },
        data: { verificationStatus: "VERIFIED", featured: true },
      });
    }
    return existing;
  }
  const dealer = await db.dealer.create({
    data: {
      name: IN_HOUSE_NAME,
      slug: IN_HOUSE_SLUG,
      location: "Nairobi",
      county: "Nairobi",
      phone: "+254717303587",
      verified: true,
      verificationStatus: "VERIFIED",
      featured: true,
    },
  });
  return dealer;
}
