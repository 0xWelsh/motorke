"use client";

import { useState } from "react";
import { clsx } from "clsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "comments", label: "Comments" },
  { id: "bids", label: "Bid History" },
  { id: "q&a", label: "Q&A" },
];

export default function AuctionTabs({ description, bidHistory = [], comments = [] }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden">
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors relative",
              activeTab === tab.id
                ? "text-[var(--text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-6">
        {activeTab === "overview" && (
          <div className="prose prose-sm max-w-none text-[var(--text-secondary)]">
            <div className="whitespace-pre-wrap leading-relaxed">{description}</div>
          </div>
        )}
        {activeTab === "bids" && (
          <div className="space-y-2">
            {bidHistory.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-6">No bids yet</p>
            ) : (
              bidHistory.map((bid, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-overlay)] flex items-center justify-center text-sm font-semibold">
                      {bid.bidder?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text)]">{bid.bidder || "Anonymous"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{bid.time}</p>
                    </div>
                  </div>
                  <p className="font-semibold tabular-nums text-[var(--text)]">
                    {bid.amount}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === "comments" && (
          <div className="text-sm text-[var(--text-muted)] text-center py-6">
            Comments will appear here
          </div>
        )}
        {activeTab === "q&a" && (
          <div className="text-sm text-[var(--text-muted)] text-center py-6">
            Ask a question about this vehicle
          </div>
        )}
      </div>
    </div>
  );
}
