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
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    gray: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800",
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
