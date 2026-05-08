"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

function formatRelativeTime(value) {
  if (!value) return "Now";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "Now";
  const diffSeconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NotificationsBell({ variant = "portal" }) {
  const isAdmin = variant === "admin";
  const isNavbar = variant === "navbar";
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const dropdownClassName = useMemo(
    () =>
      clsx(
        "absolute right-0 top-full mt-3 w-[380px] max-w-[calc(100vw-1rem)] max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:top-[4.25rem] max-sm:w-auto border shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-50 overflow-hidden",
        "bg-white dark:bg-[#0a0a0a] border-[#ddd4c8] dark:border-slate-800 text-slate-900 dark:text-white",
        "rounded-2xl"
      ),
    []
  );

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=8", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      // Quietly ignore polling errors to avoid disrupting user flow.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  const markRead = async (id) => {
    if (!id) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              read: true,
              readAt: item.readAt || new Date().toISOString(),
            }
          : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        const payload = await response.json();
        setUnreadCount(Number(payload.unreadCount || 0));
      }
    } catch {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    if (busy || unreadCount === 0) return;
    setBusy(true);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true, readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (response.ok) {
        const payload = await response.json();
        setUnreadCount(Number(payload.unreadCount || 0));
      }
    } catch {
      fetchNotifications();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "transition-all relative",
          isAdmin
            ? "text-slate-600 hover:text-[#2F855A]"
            : isNavbar
              ? "w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-[#ddd4c8] dark:border-zinc-800 text-slate-600 hover:text-[#2F855A] hover:border-slate-300 flex items-center justify-center"
            : "w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-[#ddd4c8] dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:text-[#2F855A] flex items-center justify-center"
        )}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={clsx(
            "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center",
            isAdmin || isNavbar
              ? "bg-[#2F855A] text-white border-2 border-white"
              : "bg-[#2F855A] text-white border-2 border-slate-50 dark:border-slate-900"
          )}>
            {Math.min(unreadCount, 99)}
          </span>
        )}
      </button>

      {open && (
        <div className={dropdownClassName}>
          <div className="px-5 py-4 border-b border-[#ddd4c8] dark:border-slate-800 flex items-center justify-between bg-[#fbfcfe] dark:bg-[#0f1115]">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#111827] dark:text-white">Notifications</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[10px] font-bold text-[#2F855A] uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1.5"
                disabled={busy}
              >
                <CheckCheck size={12} /> Mark all
              </button>
            )}
          </div>

          <div className="max-h-[450px] overflow-auto divide-y divide-slate-100 dark:divide-slate-800/70">
            {loading ? (
              <p className="px-6 py-10 text-xs font-medium text-slate-400 text-center uppercase tracking-widest">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-6 py-10 text-xs font-medium text-slate-400 text-center uppercase tracking-widest">
                No notifications yet.
              </p>
            ) : (
              notifications.map((item) => {
                const itemClass = clsx(
                  "block px-6 py-5 transition-all duration-300",
                  item.read ? "opacity-60 grayscale-[0.5]" : "bg-white dark:bg-transparent hover:bg-[#fbfcfe] dark:hover:bg-[#0f1115]"
                );

                const content = (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[13px] font-bold leading-snug text-[#111827] dark:text-white">{item.title}</p>
                      {!item.read && <span className="mt-1 w-2 h-2 rounded-full bg-[#2F855A] shrink-0 shadow-[0_0_8px_rgba(47,133,90,0.45)]" />}
                    </div>
                    <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5 line-clamp-2">
                       {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span>{formatRelativeTime(item.createdAt)}</span>
                       {item.dealership && <span>• {item.dealership}</span>}
                    </div>
                  </>
                );

                if (item.link) {
                  return (
                    <Link
                      key={item.id}
                      href={item.link}
                      className={itemClass}
                      onClick={() => {
                        if (!item.read) markRead(item.id);
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={clsx(itemClass, "w-full text-left")}
                    onClick={() => { if (!item.read) markRead(item.id); }}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
          <div className="p-4 bg-[#fbfcfe] dark:bg-[#0f1115] border-t border-[#ddd4c8] dark:border-slate-800">
            <Link href="/notifications" className="block text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-[#111827] dark:hover:text-white transition-colors">
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
