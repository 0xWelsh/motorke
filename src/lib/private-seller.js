// Private-seller plumbing.
//
// A verified regular account gets a mirror Dealer row (type PRIVATE,
// slug u-<handle>) so every existing inventory path — cards, hubs, search,
// sitemap, detail page — works unchanged. The user links to it via
// User.dealerId. Self-service listings are created hidden
// (available=false, listingStatus=PENDING_REVIEW) and only go public when
// an admin approves them.

import { db } from "@/lib/db";
import { SEO_COUNTIES } from "@/lib/seo-car-slug";

export const PRIVATE_LISTING_LIMIT = 2; // active cars per private seller (Phase 1)

export function countyFromLabel(label) {
  const l = String(label || "").toLowerCase();
  return SEO_COUNTIES.find((c) => l.includes(c.toLowerCase())) || "Nairobi";
}

export function isPrivateDealer(dealer) {
  return dealer?.type === "PRIVATE";
}

/** handle from a mirror dealer slug ("u-johndoe" -> "johndoe"); null otherwise */
export function handleFromDealerSlug(slug) {
  return slug && slug.startsWith("u-") ? slug.slice(2) : null;
}

/**
 * @param {{ id, name, email, handle, phone, whatsapp, locationLabel, bio, verificationStatus, verifiedAt, dealerId, role }} user
 * @returns {Promise<{ dealer } | { error }>}
 */
export async function ensurePrivateDealerFor(user) {
  if (user.role !== "BUYER") return { error: "Only regular accounts list cars themselves — dealers use the dealer dashboard." };
  if (user.verificationStatus !== "VERIFIED") return { error: "Get verified first — it takes a minute from your account page." };
  if (!user.handle) return { error: "Pick a profile handle first (account page)." };

  if (user.dealerId) {
    const linked = await db.dealer.findUnique({ where: { id: user.dealerId } });
    if (linked?.type === "PRIVATE") return { dealer: linked };
    return { error: "This account is linked to a dealership." };
  }

  const slug = `u-${user.handle}`;
  const county = countyFromLabel(user.locationLabel);

  let dealer = await db.dealer.findUnique({ where: { slug } });
  if (!dealer) {
    dealer = await db.dealer.create({
      data: {
        name: user.name,
        slug,
        phone: user.phone || "",
        whatsapp: user.whatsapp || null,
        email: user.email,
        location: user.locationLabel || county,
        county,
        description: user.bio || null,
        type: "PRIVATE",
        verified: true,
        verificationStatus: "VERIFIED",
        verificationApprovedAt: user.verifiedAt || new Date(),
      },
    });
  }
  await db.user.update({ where: { id: user.id }, data: { dealerId: dealer.id } });
  return { dealer };
}
