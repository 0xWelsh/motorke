/**
 * Dealer type and verification status helpers.
 * Used throughout the app to determine seller type and badge display.
 */

/**
 * Get badge label for seller type + verification.
 * Returns one of: "Verified Dealership", "Dealership", "Verified Broker", "Broker"
 */
export function getSellerBadge(dealer) {
  if (!dealer) return null;

  const isDealership = dealer.type === "DEALERSHIP";
  const isVerified = dealer.verificationStatus === "VERIFIED";

  if (isDealership && isVerified) return "Verified Dealership";
  if (isDealership) return "Dealership";
  if (isVerified) return "Verified Broker";
  return "Broker";
}

/**
 * Get badge variant for styling (color, icon, etc).
 * Returns: "verified_dealership" | "dealership" | "verified_broker" | "broker"
 */
export function getSellerBadgeVariant(dealer) {
  if (!dealer) return null;

  const isDealership = dealer.type === "DEALERSHIP";
  const isVerified = dealer.verificationStatus === "VERIFIED";

  if (isDealership && isVerified) return "verified_dealership";
  if (isDealership) return "dealership";
  if (isVerified) return "verified_broker";
  return "broker";
}

/**
 * Check if dealer is a dealership (vs broker).
 */
export function isDealership(dealer) {
  return dealer?.type === "DEALERSHIP";
}

/**
 * Check if dealer is a broker (vs dealership).
 */
export function isBroker(dealer) {
  return dealer?.type === "BROKER";
}

/**
 * Check if dealer has been verified (approved by admin).
 */
export function isVerified(dealer) {
  return dealer?.verificationStatus === "VERIFIED";
}

/**
 * Check if dealer is pending verification.
 */
export function isPendingVerification(dealer) {
  return dealer?.verificationStatus === "PENDING";
}

/**
 * Check if dealer's verification has been suspended.
 */
export function isSuspended(dealer) {
  return dealer?.verificationStatus === "SUSPENDED";
}

/**
 * Check if dealer's verification was rejected.
 */
export function isRejected(dealer) {
  return dealer?.verificationStatus === "REJECTED";
}

/**
 * Check if dealer needs to be verified (currently unverified or pending).
 */
export function needsVerification(dealer) {
  return (
    dealer?.verificationStatus === "UNVERIFIED" ||
    dealer?.verificationStatus === "PENDING"
  );
}

/**
 * Get human-readable verification status label.
 */
export function getVerificationStatusLabel(dealer) {
  if (!dealer) return "Unknown";

  switch (dealer.verificationStatus) {
    case "VERIFIED":
      return "Verified";
    case "PENDING":
      return "Pending Review";
    case "SUSPENDED":
      return "Verification Suspended";
    case "REJECTED":
      return "Verification Rejected";
    case "UNVERIFIED":
    default:
      return "Unverified";
  }
}

/**
 * Get human-readable verification status with extra context.
 */
export function getVerificationDescription(dealer) {
  if (!dealer) return null;

  const isDealershipType = isDealership(dealer);

  switch (dealer.verificationStatus) {
    case "VERIFIED":
      return isDealershipType
        ? "Verified dealership with official status"
        : "Verified broker with clean record";
    case "PENDING":
      return "Verification in progress. We'll notify you when complete.";
    case "SUSPENDED":
      return "Verification temporarily suspended. Contact support.";
    case "REJECTED":
      return dealer.verificationRejectionReason
        ? `Verification rejected: ${dealer.verificationRejectionReason}`
        : "Verification rejected. Contact support to appeal.";
    case "UNVERIFIED":
    default:
      return isDealershipType
        ? "Dealership not yet verified"
        : "Broker not yet verified";
  }
}

/**
 * Check if a dealer can post cars (only unverified dealerships cannot; brokers and verified can).
 * In future, could return false for REJECTED or SUSPENDED.
 */
export function canPostCars(dealer) {
  if (!dealer) return false;

  // Suspended or rejected dealers cannot post
  if (dealer.verificationStatus === "SUSPENDED" || dealer.verificationStatus === "REJECTED") {
    return false;
  }

  // All other statuses can post (UNVERIFIED, PENDING, VERIFIED)
  return true;
}

/**
 * Get verification status color for UI components.
 * Returns: "gray" | "blue" | "red" | "yellow" | "green"
 */
export function getVerificationStatusColor(dealer) {
  if (!dealer) return "gray";

  switch (dealer.verificationStatus) {
    case "VERIFIED":
      return "green";
    case "PENDING":
      return "blue";
    case "SUSPENDED":
      return "yellow";
    case "REJECTED":
      return "red";
    case "UNVERIFIED":
    default:
      return "gray";
  }
}

/**
 * Get verification status icon (for UI, e.g., lucide-react name).
 */
export function getVerificationStatusIcon(dealer) {
  if (!dealer) return null;

  switch (dealer.verificationStatus) {
    case "VERIFIED":
      return "CheckCircle";
    case "PENDING":
      return "Clock";
    case "SUSPENDED":
      return "AlertCircle";
    case "REJECTED":
      return "XCircle";
    case "UNVERIFIED":
    default:
      return "HelpCircle";
  }
}

/**
 * Build a filter query for finding dealers by type.
 * Usage: db.dealer.findMany({ where: filterDealersByType("DEALERSHIP") })
 */
export function filterDealersByType(type) {
  if (type === "DEALERSHIP") {
    return { type: "DEALERSHIP" };
  }
  if (type === "BROKER") {
    return { type: "BROKER" };
  }
  // Return null to match all types
  return null;
}

/**
 * Build a filter query for only verified dealers.
 * Usage: db.dealer.findMany({ where: { AND: [filterVerifiedDealers()] } })
 */
export function filterVerifiedDealers() {
  return { verificationStatus: "VERIFIED" };
}

/**
 * Build a filter query for dealers NOT verified.
 */
export function filterUnverifiedDealers() {
  return {
    OR: [
      { verificationStatus: "UNVERIFIED" },
      { verificationStatus: "PENDING" },
    ],
  };
}

/**
 * Build a filter combining type AND verification status.
 * Usage: db.dealer.findMany({ where: filterByTypeAndStatus("DEALERSHIP", "VERIFIED") })
 */
export function filterByTypeAndStatus(type, status) {
  const filters = {};
  if (type) filters.type = type;
  if (status) filters.verificationStatus = status;
  return Object.keys(filters).length > 0 ? filters : null;
}

/**
 * For backward compatibility: convert old verified boolean to new status.
 * Used during data migration or when reading legacy data.
 */
export function legacyVerifiedToStatus(verified) {
  return verified ? "VERIFIED" : "UNVERIFIED";
}

/**
 * For backward compatibility: check if dealer "looks verified" using either:
 * - New: verificationStatus === "VERIFIED"
 * - Old: verified === true (fallback for legacy code)
 */
export function isVerifiedLegacy(dealer) {
  if (!dealer) return false;
  return dealer.verificationStatus === "VERIFIED" || dealer.verified === true;
}
