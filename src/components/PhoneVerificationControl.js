"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeKenyanPhone } from "@/lib/phone-verification";

export default function PhoneVerificationControl({ phone, className = "" }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const normalizedPhone = useMemo(() => normalizeKenyanPhone(phone), [phone]);
  const [isVerified, setIsVerified] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      if (!normalizedPhone) {
        setIsVerified(false);
        return;
      }
      try {
        const res = await fetch(`/api/phone-verification/status?phone=${normalizedPhone}`);
        const data = await res.json();
        setIsVerified(Boolean(data?.verified));
      } catch {}
    }
    loadStatus();
  }, [normalizedPhone]);

  async function sendCode() {
    if (!normalizedPhone) {
      setMessage("Enter a valid phone number first.");
      return;
    }
    try {
      setStatus("sending");
      const res = await fetch("/api/phone-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send code");
      setShowCodeInput(true);
      setMessage("Code sent. Enter it below.");
      setStatus("idle");
    } catch (error) {
      setStatus("idle");
      setMessage(error.message || "Failed to send code.");
    }
  }

  async function verifyCode() {
    if (!code.trim()) return;
    try {
      setStatus("verifying");
      const res = await fetch("/api/phone-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Verification failed");
      setIsVerified(true);
      setShowCodeInput(false);
      setCode("");
      setMessage("Phone verified successfully.");
      setStatus("idle");
    } catch (error) {
      setStatus("idle");
      setMessage(error.message || "Verification failed.");
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
            isVerified ? "bg-white/[0.03] text-[var(--accent)]" : "bg-amber-100 text-amber-700"
          }`}
        >
          {isVerified ? "Phone verified" : "Phone not verified"}
        </span>
        {!isVerified && (
          <button
            type="button"
            onClick={sendCode}
            disabled={status === "sending" || !normalizedPhone}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-white disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Send OTP"}
          </button>
        )}
      </div>
      {!isVerified && showCodeInput && (
        <div className="flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="h-9 w-44 border border-white/[0.06] bg-[#1c1c1c] px-3 text-xs font-semibold"
          />
          <button
            type="button"
            onClick={verifyCode}
            disabled={status === "verifying" || code.trim().length < 6}
            className="h-9 px-3 text-[10px] font-bold uppercase tracking-widest bg-[var(--accent)] text-white disabled:opacity-50"
          >
            {status === "verifying" ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}
      {message ? <p className="text-[11px] font-semibold text-zinc-400">{message}</p> : null}
    </div>
  );
}
