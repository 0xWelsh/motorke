"use client";

import { useState, useEffect, useCallback } from "react";

function QrPage() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [qrKey, setQrKey] = useState(0);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp-bot/status");
      const data = await res.json();
      setSession(data);
      if (data.status === "QR" || data.status === "FAILED") {
        setQrKey((k) => k + 1);
      }
    } catch {
      setError("Cannot reach daemon");
    }
  }, []);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const restartSession = async () => {
    setError("");
    try {
      await fetch("/api/whatsapp-bot/restart", { method: "POST" });
      setTimeout(fetchSession, 3000);
    } catch {
      setError("Restart failed");
    }
  };

  const statusColor =
    session?.status === "CONNECTED"
      ? "text-emerald-600"
      : session?.status === "QR"
        ? "text-yellow-400"
        : session?.status === "FAILED"
          ? "text-red-600"
          : "text-muted";

  const statusLabel =
    session?.status === "CONNECTED"
      ? "Connected"
      : session?.status === "QR"
        ? "Scan QR Code"
        : session?.status === "FAILED"
          ? "Failed — retrying..."
          : session?.status || "Starting...";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-text p-6">
      <h1 className="text-xl font-bold mb-6">WhatsApp Bot</h1>

      {/* Status */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted">Connection</span>
          <span className={`font-mono ${statusColor}`}>{statusLabel}</span>
        </div>
        {session?.me?.id && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-dim">Phone</span>
            <span className="text-secondary">+{session.me.id}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-800 rounded-lg p-3 mb-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* QR Code */}
      {session?.status === "QR" && (
        <div className="bg-surface border border-border rounded-lg p-6 mb-6 text-center">
          <h2 className="text-sm font-semibold text-secondary mb-4">
            Scan QR Code with WhatsApp
          </h2>
          <div className="bg-surface rounded-lg inline-block p-2 mb-4">
            <img
              src={`/api/whatsapp-bot/qr?t=${qrKey}`}
              alt="WhatsApp QR"
              className="w-64 h-64"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <p className="text-xs text-dim">
            Open WhatsApp → 3 dots → Linked Devices → Link a Device
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={restartSession}
          className="flex-1 bg-surface-overlay hover:bg-surface-overlay text-secondary rounded px-4 py-2 text-sm transition-colors"
        >
          Restart Session
        </button>
        <button
          onClick={fetchSession}
          className="flex-1 bg-surface-overlay hover:bg-surface-overlay text-secondary rounded px-4 py-2 text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {session?.status === "CONNECTED" && (
        <div className="mt-6 bg-emerald-900/30 border border-emerald-800 rounded-lg p-4 text-center">
          <p className="text-emerald-600 font-medium">Bot is active!</p>
          <p className="text-xs text-emerald-600 mt-1">
            Message your bot from another WhatsApp number to test
          </p>
        </div>
      )}
    </div>
  );
}

export default QrPage;
