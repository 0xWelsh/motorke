"use client";

import { useState, useEffect } from "react";
import { Clock, Gavel } from "lucide-react";
import { formatCarPrice } from "@/lib/utils";

function pad(n) {
  return String(n).padStart(2, "0");
}

function Countdown({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0, ended: false });

  useEffect(() => {
    function calc() {
      const end = new Date(endsAt).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0, ended: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, mins, secs, ended: false });
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (timeLeft.ended) {
    return (
      <div className="text-center py-2">
        <p className="text-lg font-bold text-[var(--accent)]">Auction Ended</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Mins", value: timeLeft.mins },
        { label: "Secs", value: timeLeft.secs },
      ].map((item) => (
        <div key={item.label} className="rounded-lg bg-[var(--surface-overlay)] px-2 py-2.5">
          <div className="text-lg md:text-xl font-extrabold tabular-nums text-[var(--text)]">
            {pad(item.value)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BidPanel({ currentBid = 0, bidCount = 0, endsAt, reserveMet = true, buyItNow = null }) {
  const [bidAmount, setBidAmount] = useState(currentBid + 250000);

  const increment = (amount) => {
    setBidAmount((v) => v + amount);
  };

  const minBid = currentBid > 0 ? currentBid + 250000 : 250000;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Current Bid</p>
            <p className="text-3xl md:text-4xl font-extrabold tabular-nums text-[var(--text)]">
              {currentBid > 0 ? formatCarPrice({ price: currentBid }) : "No Bids Yet"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-secondary)] tabular-nums">
              {bidCount} {bidCount === 1 ? "bid" : "bids"}
            </p>
            <p className={`text-xs font-semibold mt-1 ${reserveMet ? "text-emerald-600" : "text-amber-600"}`}>
              {reserveMet ? "Reserve met" : "Reserve not met"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3 text-sm text-[var(--text-secondary)]">
          <Clock className="w-4 h-4" />
          <span className="font-medium">Time Remaining</span>
        </div>
        <Countdown endsAt={endsAt} />
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Your max bid</span>
          <span className="font-semibold tabular-nums text-[var(--text)]">{formatCarPrice({ price: bidAmount })}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => increment(250000)}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors"
          >
            +KES 250k
          </button>
          <button
            onClick={() => increment(500000)}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors"
          >
            +KES 500k
          </button>
          <button
            onClick={() => increment(1000000)}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors"
          >
            +KES 1M
          </button>
        </div>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-colors">
          <Gavel className="w-4 h-4" />
          Place Bid
        </button>
        <p className="text-xs text-center text-[var(--text-muted)]">
          Min bid: {formatCarPrice({ price: minBid })}
        </p>
      </div>

      {buyItNow && (
        <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-overlay)]/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Buy It Now</span>
            <span className="text-lg font-bold tabular-nums text-[var(--text)]">{formatCarPrice({ price: buyItNow })}</span>
          </div>
          <button className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white font-bold transition-colors">
            Buy It Now
          </button>
        </div>
      )}
    </div>
  );
}
