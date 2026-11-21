"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushOptIn({ variant = "banner" }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      // Get VAPID key
      const res = await fetch("/api/push/vapid-public-key");
      const { key } = await res.json();
      if (!key) {
        console.error("[Push] No VAPID key");
        setLoading(false);
        return;
      }

      // Subscribe to push
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const sub = subscription.toJSON();

      // Store on server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        }),
      });

      setSubscribed(true);
      setJustSubscribed(true);
      setTimeout(() => setJustSubscribed(false), 3000);
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const unsubscribe = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setSubscribed(false);
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  if (!supported || permission === "denied") return null;

  // Banner variant — inline in footer or page
  if (variant === "banner") {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          {subscribed ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <BellRing className="h-5 w-5 text-emerald-600" />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay">
              <Bell className="h-5 w-5 text-muted" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-text">
              {subscribed ? "Notifications enabled" : "Get notified about new cars"}
            </p>
            <p className="text-[11px] text-muted">
              {subscribed
                ? "You'll get alerts for price drops and new listings"
                : "Be the first to know when matching cars are listed"}
            </p>
          </div>
          <button
            onClick={subscribed ? unsubscribe : subscribe}
            disabled={loading}
            className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${
              subscribed
                ? "bg-surface-overlay text-muted hover:bg-surface-overlay"
                : "bg-accent text-white hover:bg-accent-hover"
            } disabled:opacity-50`}
          >
            {loading ? "..." : subscribed ? "Disable" : "Enable"}
          </button>
        </div>
        {justSubscribed && (
          <p className="mt-2 text-[11px] font-bold text-emerald-600">Notifications enabled!</p>
        )}
      </div>
    );
  }

  // Compact variant — for navbar or footer
  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
        subscribed
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-surface-overlay text-muted hover:bg-surface-overlay"
      } disabled:opacity-50`}
      title={subscribed ? "Disable notifications" : "Enable notifications"}
    >
      {subscribed ? <BellRing className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
      {subscribed ? "Alerts on" : "Alerts off"}
    </button>
  );
}
