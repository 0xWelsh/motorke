"use client";

import { getSellerBadge, getVerificationStatusColor, getVerificationStatusIcon } from "@/lib/dealer-type";
import { CheckCircle, Clock, AlertCircle, XCircle, HelpCircle } from "lucide-react";

/**
 * Display seller type and verification status badge.
 * Shows: "Verified Dealership", "Dealership", "Verified Broker", or "Broker"
 */
export default function SellerBadge({ dealer, className = "", tooltip = true }) {
  if (!dealer) return null;

  const badge = getSellerBadge(dealer);
  const color = getVerificationStatusColor(dealer);
  const iconName = getVerificationStatusIcon(dealer);

  // Map icon names to actual components
  const iconMap = {
    CheckCircle: <CheckCircle className="h-4 w-4" />,
    Clock: <Clock className="h-4 w-4" />,
    AlertCircle: <AlertCircle className="h-4 w-4" />,
    XCircle: <XCircle className="h-4 w-4" />,
    HelpCircle: <HelpCircle className="h-4 w-4" />,
  };

  const colorClasses = {
    green: "bg-emerald-900/20 text-emerald-300 border-emerald-800",
    blue: "bg-blue-900/20 text-blue-300 border-blue-800",
    yellow: "bg-yellow-900/20 text-yellow-300 border-yellow-800",
    red: "bg-red-900/20 text-red-300 border-red-800",
    gray: "bg-white/[0.03] text-zinc-400 border-white/[0.06]",
  };

  const tooltipText = {
    VERIFIED: "Verified and approved by BIDGARI",
    PENDING: "Verification submitted, pending review",
    SUSPENDED: "Verification temporarily suspended",
    REJECTED: "Verification was rejected",
    UNVERIFIED: "Not yet verified",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border rounded-full ${
        colorClasses[color]
      } ${className}`}
      title={tooltip ? tooltipText[dealer.verificationStatus] : undefined}
    >
      {iconMap[iconName]}
      <span>{badge}</span>
    </div>
  );
}
